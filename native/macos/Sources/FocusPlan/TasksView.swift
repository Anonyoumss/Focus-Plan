import SwiftUI

struct TasksView: View {
    @EnvironmentObject var app: AppState
    @State private var newTitle = ""

    var body: some View {
        let ar = app.ar
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                TextField(L.tr("addTask", ar), text: $newTitle)
                    .textFieldStyle(.roundedBorder)
                    .onSubmit { app.addTask(newTitle); newTitle = "" }
                Button {
                    app.addTask(newTitle); newTitle = ""
                } label: { Image(systemName: "plus.circle.fill").font(.title2) }
                .buttonStyle(.plain)
                .disabled(newTitle.trimmingCharacters(in: .whitespaces).isEmpty)
            }

            if app.state.tasks.isEmpty {
                Spacer()
                Text(L.tr("emptyTasks", ar))
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                Spacer()
            } else {
                List {
                    ForEach(app.state.tasks) { task in
                        HStack {
                            Button { app.toggleTask(task.id) } label: {
                                Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(task.isCompleted ? Color.green : Color.secondary)
                            }
                            .buttonStyle(.plain)
                            Text(task.title)
                                .strikethrough(task.isCompleted)
                                .foregroundStyle(task.isCompleted ? .secondary : .primary)
                            Spacer()
                            Button { app.deleteTask(task.id) } label: {
                                Image(systemName: "trash").foregroundStyle(.red.opacity(0.7))
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.vertical, 4)
                    }
                }
                .listStyle(.inset)
            }
        }
        .padding(24)
        .navigationTitle(L.tr("tasks", ar))
    }
}
