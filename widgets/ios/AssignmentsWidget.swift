import WidgetKit
import SwiftUI

// Code duplicated for independence, or could share file if configured in Xcode, but separate is safer here.
struct AssignmentData: Codable, Identifiable {
    let id: String
    let title: String
    let deadline: String
    let courseName: String
    let daysRemaining: Int
    let timeString: String?
}

struct AssignmentsProvider: TimelineProvider {
    let suiteName = "group.com.mono0261.universitytimetablemobile.expowidgets"
    let dataKey = "widgetAssignments" // Key changed

    func placeholder(in context: Context) -> AssignmentsEntry {
        AssignmentsEntry(date: Date(), assignments: [], isPremium: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (AssignmentsEntry) -> ()) {
        let entry = loadEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AssignmentsEntry>) -> ()) {
        let entry = loadEntry()
        // Refresh every 30 minutes
        let nextUpdateDate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdateDate))
        completion(timeline)
    }
    
    func loadEntry() -> AssignmentsEntry {
        let userDefaults = UserDefaults(suiteName: suiteName)
        let jsonString = userDefaults?.string(forKey: dataKey)
        
        var assignments: [AssignmentData] = []
        
        if let json = jsonString, let data = json.data(using: .utf8) {
            let decoder = JSONDecoder()
            if let decoded = try? decoder.decode([AssignmentData].self, from: data) {
                 // Recalculate daysRemaining
                 assignments = decoded.map { item in
                     let calculatedDays = calculateDaysRemaining(deadline: item.deadline) ?? item.daysRemaining
                     return AssignmentData(
                         id: item.id,
                         title: item.title,
                         deadline: item.deadline,
                         courseName: item.courseName,
                         daysRemaining: calculatedDays,
                         timeString: item.timeString
                     )
                 }.sorted { $0.daysRemaining < $1.daysRemaining }
            }
        }
        
        // Load Premium status
        let isPremiumStr = userDefaults?.string(forKey: "isPremium") ?? "false"
        let isPremium = isPremiumStr == "true"
        
        return AssignmentsEntry(date: Date(), assignments: assignments, isPremium: isPremium)
    }
    
    func calculateDaysRemaining(deadline: String) -> Int? {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        
        // Try YYYY-MM-DD
        formatter.dateFormat = "yyyy-MM-dd"
        if let date = formatter.date(from: deadline) {
             return daysFromToday(to: date)
        }
        
        // Try YYYY/MM/DD
        formatter.dateFormat = "yyyy/MM/dd"
        if let date = formatter.date(from: deadline) {
             return daysFromToday(to: date)
        }
        
        // Try MM/DD (assume current year or next year?)
        // Simple MM/DD assumption: Current Year.
        // Better: widgetHelper logic does Current Year.
        let parts = deadline.split(separator: "/")
        if parts.count == 2, let month = Int(parts[0]), let day = Int(parts[1]) {
            let now = Date()
            let calendar = Calendar.current
            let year = calendar.component(.year, from: now)
            var components = DateComponents()
            components.year = year
            components.month = month
            components.day = day
            if let date = calendar.date(from: components) {
                return daysFromToday(to: date)
            }
        }
        
        return nil
    }
    
    func daysFromToday(to date: Date) -> Int {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let target = calendar.startOfDay(for: date)
        let components = calendar.dateComponents([.day], from: today, to: target)
        return components.day ?? 0
    }
}

struct AssignmentsEntry: TimelineEntry {
    let date: Date
    let assignments: [AssignmentData]
    let isPremium: Bool
}

struct AssignmentsWidgetEntryView : View {
    var entry: AssignmentsProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .accessoryCircular:
            CircularAssignmentView(entry: entry)
        case .accessoryRectangular:
            RectangularAssignmentView(entry: entry)
        case .accessoryInline:
            InlineAssignmentView(entry: entry)
        default:
            SystemAssignmentView(entry: entry)
        }
    }
}

// MARK: - Lock Screen Views

struct CircularAssignmentView: View {
    var entry: AssignmentsProvider.Entry
    var body: some View {
        ZStack {
            if let first = entry.assignments.first {
                VStack(spacing: 0) {
                    Text("\(first.daysRemaining)")
                        .font(.system(size: 16, weight: .bold))
                    Text("日")
                        .font(.system(size: 8))
                }
            } else {
                Image(systemName: "checkmark")
            }
        }
    }
}

struct RectangularAssignmentView: View {
    var entry: AssignmentsProvider.Entry
    var body: some View {
        if let first = entry.assignments.first {
            VStack(alignment: .leading) {
                Text(first.title)
                    .font(.headline)
                    .widgetAccentable()
                    .lineLimit(1)
                Text("残り \(first.daysRemaining)日 • \(first.courseName)")
                    .font(.caption)
                    .lineLimit(1)
                    .foregroundColor(.secondary)
            }
        } else {
            Text("課題なし")
                .foregroundColor(.secondary)
        }
    }
}

struct InlineAssignmentView: View {
    var entry: AssignmentsProvider.Entry
    var body: some View {
        if let first = entry.assignments.first {
            Text("課題: \(first.title)")
        } else {
            Text("課題なし")
        }
    }
}

// MARK: - Home Screen View (Existing System View)

struct SystemAssignmentView: View {
    var entry: AssignmentsProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("課題一覧")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(entry.isPremium ? .purple : .indigo)
            
            if entry.assignments.isEmpty {
                Spacer()
                Text("課題はありません🎉")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity, alignment: .center)
                Spacer()
            } else {
                VStack(spacing: 6) {
                    ForEach(entry.assignments.prefix(family == .systemLarge ? 6 : 3)) { item in
                        HStack(spacing: 8) {
                            // Days Badge
                            ZStack {
                                Group {
                                    if entry.isPremium {
                                        RoundedRectangle(cornerRadius: 6)
                                            .fill(LinearGradient(colors: [getColor(days: item.daysRemaining), getColor(days: item.daysRemaining).opacity(0.8)], startPoint: .top, endPoint: .bottom))
                                    } else {
                                        RoundedRectangle(cornerRadius: 6)
                                            .fill(getColor(days: item.daysRemaining))
                                    }
                                }
                                .frame(width: 32, height: 32)
                                VStack(spacing: 0) {
                                    Text("\(item.daysRemaining)")
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundColor(.white)
                                    Text("日")
                                        .font(.system(size: 8))
                                        .foregroundColor(.white.opacity(0.9))
                                }
                            }
                            
                            VStack(alignment: .leading, spacing: 1) {
                                Text(item.title)
                                    .font(.system(size: 12, weight: .semibold))
                                    .lineLimit(1)
                                Text("\(item.courseName)\(item.timeString != nil ? " • \(item.timeString!)" : "")")
                                    .font(.system(size: 10))
                                    .foregroundColor(.gray)
                                    .lineLimit(1)
                            }
                            Spacer()
                        }
                    }
                }
                if entry.assignments.count > (family == .systemLarge ? 6 : 3) {
                     Text("他 \(entry.assignments.count - (family == .systemLarge ? 6 : 3)) 件")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
            }
            Spacer()
        }
        .padding(12)
        .widgetBackground()
    }
    
    func getColor(days: Int) -> Color {
        if days <= 1 { return .red }
        if days <= 3 { return .orange }
        return .indigo
    }
}

struct AssignmentsWidget: Widget {
    let kind: String = "AssignmentsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AssignmentsProvider()) { entry in
            AssignmentsWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("課題リスト")
        .description("提出期限の近い課題を表示します。")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular, .accessoryInline])
        .contentMarginsDisabledIfAvailable()
    }
}
