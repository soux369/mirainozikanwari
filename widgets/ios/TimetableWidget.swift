import WidgetKit
import SwiftUI

// Data Model
struct Course: Codable, Identifiable {
    let id: String
    let name: String
    let day: String
    let period: Int
    let room: String?
}

struct Provider: TimelineProvider {
    // MUST match the App Group ID
    let suiteName = "group.com.mono0261.universitytimetablemobile.expowidgets"
    let dataKey = "widgetData"

    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), courses: [], displayDateStr: "今日", isPremium: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = loadEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ()) {
        let entry = loadEntry()
        // Refresh every 30 minutes
        let nextUpdateDate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdateDate))
        completion(timeline)
    }
    
    func loadEntry() -> SimpleEntry {
        let userDefaults = UserDefaults(suiteName: suiteName)
        let jsonString = userDefaults?.string(forKey: dataKey)
        
        var displayCourses: [Course] = []
        var displayDateStr = "今日"
        
        if let json = jsonString, let data = json.data(using: .utf8) {
            let decoder = JSONDecoder()
            if let allCourses = try? decoder.decode([Course].self, from: data) {
                
                // 1. Get Today's Courses
                let todayStr = getDayString(for: Date())
                var todayCourses = allCourses.filter { $0.day == todayStr }
                todayCourses.sort { $0.period < $1.period }
                
                // 2. Check if today's classes are effectively "over"
                // Simple logic: If current hour > last course's period * roughly + 9?
                // Better: Just filter out courses that are likely "past" to show the "Next" one.
                // Assuming standard: 1:9-10:30, 2:10:40-12:10, 3:13-14:30, 4:14:40-16:10, 5:16:20-17:50, 6:18-19:30
                // We'll use a helper to see if a period is "done".
                
                let upcomingToday = todayCourses.filter { !isPeriodOver(period: $0.period) }
                
                if !upcomingToday.isEmpty {
                    // We have classes left today
                    displayCourses = upcomingToday
                    displayDateStr = "今日"
                } else {
                    // Today is done (or empty), look for Tomorrow (or the next active day)
                    // limit search to next 7 days
                    for i in 1...7 {
                        let nextDate = Calendar.current.date(byAdding: .day, value: i, to: Date())!
                        let nextDayStr = getDayString(for: nextDate)
                        let nextCourses = allCourses.filter { $0.day == nextDayStr }.sorted { $0.period < $1.period }
                        
                        if !nextCourses.isEmpty {
                            displayCourses = nextCourses
                            
                            // Check if it's tomorrow
                            if i == 1 {
                                displayDateStr = "明日"
                            } else {
                                displayDateStr = getLocalizedDayParams(date: nextDate) // e.g. "月曜"
                            }
                            break
                        }
                    }
                    if displayCourses.isEmpty {
                         displayDateStr = "予定なし"
                    }
                }
            }
        }
        
        // Load Premium status (saved as JSON string "true"/"false")
        let isPremiumStr = userDefaults?.string(forKey: "isPremium") ?? "false"
        let isPremium = isPremiumStr == "true"
        
        return SimpleEntry(date: Date(), courses: displayCourses, displayDateStr: displayDateStr, isPremium: isPremium)
    }
    
    func isPeriodOver(period: Int) -> Bool {
        // Rough estimation of period end times
        // 1: 10:30, 2: 12:10, 3: 14:30, 4: 16:10, 5: 17:50, 6: 19:30
        let currentHour = Calendar.current.component(.hour, from: Date())
        let currentMinute = Calendar.current.component(.minute, from: Date())
        let nowMinutes = currentHour * 60 + currentMinute
        
        var endMinutes = 0
        switch period {
        case 1: endMinutes = 10 * 60 + 30
        case 2: endMinutes = 12 * 60 + 10
        case 3: endMinutes = 14 * 60 + 30
        case 4: endMinutes = 16 * 60 + 10
        case 5: endMinutes = 17 * 60 + 50
        case 6: endMinutes = 19 * 60 + 30
        default: endMinutes = 19 * 60 + 30 // Late
        }
        
        // Return true if NOW > EndTime
        return nowMinutes > endMinutes
    }
    
    func getDayString(for date: Date) -> String {
        let weekday = Calendar.current.component(.weekday, from: date)
        switch weekday {
        case 1: return "Sun"
        case 2: return "Mon"
        case 3: return "Tue"
        case 4: return "Wed"
        case 5: return "Thu"
        case 6: return "Fri"
        case 7: return "Sat"
        default: return "Sun"
        }
    }
    
    func getLocalizedDayParams(date: Date) -> String {
        let weekday = Calendar.current.component(.weekday, from: date)
        switch weekday {
        case 1: return "日曜"
        case 2: return "月曜"
        case 3: return "火曜"
        case 4: return "水曜"
        case 5: return "木曜"
        case 6: return "金曜"
        case 7: return "土曜"
        default: return ""
        }
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let courses: [Course]
    let displayDateStr: String
    let isPremium: Bool
}

struct TimetableWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .accessoryCircular:
            CircularView(entry: entry)
        case .accessoryRectangular:
            RectangularView(entry: entry)
        case .accessoryInline:
            InlineView(entry: entry)
        default:
            SystemView(entry: entry)
        }
    }
}

struct CircularView: View {
    var entry: Provider.Entry
    var body: some View {
        ZStack {
            if let nextCourse = entry.courses.first {
                VStack {
                    Text("\(nextCourse.period)")
                        .font(.system(size: 20, weight: .bold))
                    Text(nextCourse.room ?? "")
                        .font(.system(size: 8))
                        .lineLimit(1)
                }
            } else {
                Image(systemName: "checkmark")
            }
        }
    }
}

struct RectangularView: View {
    var entry: Provider.Entry
    var body: some View {
        if let nextCourse = entry.courses.first {
            VStack(alignment: .leading) {
                Text("\(nextCourse.period)限: \(nextCourse.name)")
                    .font(.headline)
                    .widgetAccentable()
                HStack {
                    Text(entry.displayDateStr) .font(.caption2).foregroundColor(.secondary)
                    if let room = nextCourse.room {
                        Text(room).font(.caption)
                    }
                }
            }
        } else {
            Text("授業なし")
                .foregroundColor(.gray)
        }
    }
}

struct InlineView: View {
    var entry: Provider.Entry
    var body: some View {
        if let nextCourse = entry.courses.first {
            Text("\(entry.displayDateStr) \(nextCourse.period)限 \(nextCourse.name)")
        } else {
            Text("授業なし")
        }
    }
}

struct SystemView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(entry.displayDateStr + "の時間割")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(entry.isPremium ? .purple : .indigo)
                Spacer()
                if entry.isPremium {
                    Text("PRO")
                        .font(.system(size: 8, weight: .black))
                        .padding(.horizontal, 4)
                        .padding(.vertical, 2)
                        .background(LinearGradient(colors: [.purple, .blue], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .foregroundColor(.white)
                        .cornerRadius(4)
                }
                // Show "Next" indicator if it's tomorrow
                if entry.displayDateStr != "今日" && !entry.courses.isEmpty {
                   Text("Next")
                        .font(.caption2)
                        .padding(2)
                        .background(Color.orange.opacity(0.2))
                        .foregroundColor(.orange)
                        .cornerRadius(4)
                }
            }
            
            if entry.courses.isEmpty {
                Spacer()
                Text("授業はありません")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity, alignment: .center)
                Spacer()
            } else {
                VStack(spacing: 4) {
                    ForEach(entry.courses.prefix(family == .systemLarge ? 8 : 3)) { course in
                        HStack {
                            Text("\(course.period)")
                                .font(.system(size: 10, weight: .bold))
                                .frame(width: 16, height: 16)
                                .background(entry.isPremium ? AnyView(LinearGradient(colors: [.purple, .blue], startPoint: .top, endPoint: .bottom)) : AnyView(Color.indigo))
                                .foregroundColor(.white)
                                .clipShape(Circle())
                            
                            VStack(alignment: .leading) {
                                Text(course.name)
                                    .font(.system(size: 12, weight: .semibold))
                                    .lineLimit(1)
                                if let room = course.room, !room.isEmpty {
                                    Text(room)
                                        .font(.system(size: 10))
                                        .foregroundColor(.gray)
                                        .lineLimit(1)
                                }
                            }
                            Spacer()
                        }
                    }
                }
                if entry.courses.count > (family == .systemLarge ? 8 : 3) {
                    Text("他 \(entry.courses.count - (family == .systemLarge ? 8 : 3)) 件")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
            }
            Spacer()
        }
        .padding(12)
    }
}

extension WidgetConfiguration {
    func contentMarginsDisabledIfAvailable() -> some WidgetConfiguration {
        if #available(iOSApplicationExtension 17.0, *) {
            return self.contentMarginsDisabled()
        } else {
            return self
        }
    }
}

extension View {
    func widgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            return containerBackground(.fill.tertiary, for: .widget)
        } else {
            return background(Color(UIColor.systemBackground))
        }
    }
}

struct TimetableWidget: Widget {
    let kind: String = "TimetableWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            TimetableWidgetEntryView(entry: entry)
                .widgetBackground()
        }
        .configurationDisplayName("次の授業")
        .description("時間割を表示します。今日が終わると自動で次の日に切り替わります。")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular, .accessoryInline])
        .contentMarginsDisabledIfAvailable()
    }
}
