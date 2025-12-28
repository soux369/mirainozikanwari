import WidgetKit
import SwiftUI

// Code duplicated for independence, or could share file if configured in Xcode, but separate is safer here.
struct AssignmentData: Codable, Identifiable {
    let id: String
    let title: String
    let deadline: String
    let courseName: String
    let daysRemaining: Int
}

struct AssignmentsProvider: TimelineProvider {
    let suiteName = "group.com.mono0261.universitytimetablemobile.expowidgets"
    let dataKey = "widgetAssignments" // Key changed

    func placeholder(in context: Context) -> AssignmentsEntry {
        AssignmentsEntry(date: Date(), assignments: [])
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
                assignments = decoded
            }
        }
        
        return AssignmentsEntry(date: Date(), assignments: assignments)
    }
}

struct AssignmentsEntry: TimelineEntry {
    let date: Date
    let assignments: [AssignmentData]
}

struct AssignmentsWidgetEntryView : View {
    var entry: AssignmentsProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("課題一覧")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.indigo)
            
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
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(getColor(days: item.daysRemaining))
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
                                Text(item.courseName)
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
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .contentMarginsDisabledIfAvailable()
    }
}
