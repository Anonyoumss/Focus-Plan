/*
 * Focus Plan — native Linux app (GTK4 + libadwaita).
 * 100% offline-first: state persisted to ~/.local/share/focus-plan/state.json.
 * No network calls; cloud login is a documented future addition.
 */
#include <adwaita.h>
#include <gtk/gtk.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define MAX_TASKS 256

typedef struct {
    int focus_min, short_min, long_min, until_long;
    char lang[4];
    int sound;
} Settings;

typedef struct { char title[256]; int done; char category[32]; } Task;

typedef struct { char date[11]; int mode; int seconds; char task[128]; } SessRec;

typedef struct {
    Settings s;
    Task tasks[MAX_TASKS];
    int task_count;
    int sessions_today;
    char last_date[11];
    int streak;
    char last_streak_date[11];
    SessRec sessions[2000];
    int session_count;
    int total_focus_seconds;
    char active_task[128];
} State;

typedef struct {
    State st;
    GtkWidget *window, *stack;
    int mode;                 /* 0 focus, 1 short, 2 long */
    int remaining;
    int running;
    time_t end_time;
    int sessions_in_cycle;
    GtkWidget *time_label, *mode_label, *start_btn, *stats_label;
    GtkWidget *task_list, *task_entry, *tasks_empty;
    GtkWidget *tab_btns[3];
    GtkWidget *progress, *active_btn, *cat_btns[4];
    int cat_sel;
} App;

static App app;

static const char *CATS[] = {"study", "work", "personal", "other"};
static void sync_active_btn(App *a);

static const char *APP_CSS =
    "/* Focus Plan — Material 3 inspired GTK4/libadwaita theme (embedded).\n"
    " * Uses Adwaita named colors so light/dark follow the system style manager. */\n"
    ".time-digits {\n"
    "  font-size: 76px;\n"
    "  font-weight: 300;\n"
    "  font-variant-numeric: tabular-nums;\n"
    "  letter-spacing: 0.5px;\n"
    "}\n"
    ".time-digits.flash {\n"
    "  color: @destructive_bg_color;\n"
    "}\n"
    ".pill.check, .pill {\n"
    "  border-radius: 999px;\n"
    "  padding: 6px 22px;\n"
    "}\n"
    ".pill.check {\n"
    "  background-color: @accent_bg_color;\n"
    "  color: @accent_fg_color;\n"
    "}\n"
    "button.suggested-action {\n"
    "  border-radius: 999px;\n"
    "  padding: 8px 32px;\n"
    "  font-weight: 500;\n"
    "}\n"
    ".dim-label {\n"
    "  opacity: 0.55;\n"
    "}\n"
    "progressbar.timer-progress {\n"
    "  min-height: 6px;\n"
    "  border-radius: 3px;\n"
    "  margin-top: 8px;\n"
    "  margin-bottom: 8px;\n"
    "}\n"
    ".cat-chip {\n"
    "  border-radius: 999px;\n"
    "  padding: 4px 14px;\n"
    "  font-size: 0.85em;\n"
    "}\n"
    ".cat-chip:checked {\n"
    "  background-color: @accent_bg_color;\n"
    "  color: @accent_fg_color;\n"
    "}\n"
;

static void load_css(void) {
    GtkCssProvider *p = gtk_css_provider_new();
    gtk_css_provider_load_from_data(p, APP_CSS, -1);
    gtk_style_context_add_provider_for_display(gdk_display_get_default(),
        GTK_STYLE_PROVIDER(p), GTK_STYLE_PROVIDER_PRIORITY_APPLICATION);
    g_object_unref(p);
}

static gboolean unflash_cb(gpointer data) {
    App *a = data;
    gtk_widget_remove_css_class(a->time_label, "flash");
    return G_SOURCE_REMOVE;
}


/* forward declarations */
static void check_toggled(GtkCheckButton *c, gpointer d);
static void task_deleted(GtkButton *b, gpointer d);
static void snd_toggled(GtkCheckButton *c, gpointer d);
static void on_tab_toggled(GtkToggleButton *b, gpointer d);
static void rebuild_ui(App *a);
static GtkWidget *build_stats_page(App *a);

/* ---------- persistence ---------- */
static char *state_path(void) {
    char *dir = g_strdup_printf("%s/.local/share/focus-plan", g_get_home_dir());
    g_mkdir_with_parents(dir, 0755);
    char *p = g_strdup_printf("%s/state.json", dir);
    g_free(dir);
    return p;
}

static void json_escape(const char *in, char *out, size_t outsz) {
    size_t j = 0;
    for (size_t i = 0; in[i] && j + 2 < outsz; i++) {
        if (in[i] == '"' || in[i] == '\\') out[j++] = '\\';
        out[j++] = in[i];
    }
    out[j] = 0;
}

static void save_state(State *st) {
    char *p = state_path();
    FILE *f = fopen(p, "w");
    g_free(p);
    if (!f) return;
    fprintf(f, "{\"settings\":{\"focus_min\":%d,\"short_min\":%d,\"long_min\":%d,\"until_long\":%d,\"lang\":\"%s\",\"sound\":%d},",
            st->s.focus_min, st->s.short_min, st->s.long_min, st->s.until_long, st->s.lang, st->s.sound);
    fprintf(f, "\"tasks\":[");
    for (int i = 0; i < st->task_count; i++) {
        char esc[600], cesc[80]; json_escape(st->tasks[i].title, esc, sizeof esc);
        json_escape(st->tasks[i].category, cesc, sizeof cesc);
        fprintf(f, "%s{\"title\":\"%s\",\"done\":%d,\"category\":\"%s\"}", i ? "," : "", esc, st->tasks[i].done, cesc);
    }
    fprintf(f, "],\"sessions\":[");
    for (int i = 0; i < st->session_count && i < 2000; i++) {
        char tt[300]; json_escape(st->sessions[i].task, tt, sizeof tt);
        fprintf(f, "%s{\"date\":\"%s\",\"mode\":%d,\"seconds\":%d,\"task\":\"%s\"}",
                i ? "," : "", st->sessions[i].date, st->sessions[i].mode, st->sessions[i].seconds, tt);
    }
    char aesc[300]; json_escape(st->active_task, aesc, sizeof aesc);
    fprintf(f, "],\"active_task\":\"%s\",\"sessions_today\":%d,\"last_date\":\"%s\",\"streak\":%d,\"last_streak_date\":\"%s\",\"total_focus_seconds\":%d}\n",
            aesc, st->sessions_today, st->last_date, st->streak, st->last_streak_date, st->total_focus_seconds);
    fclose(f);
}

static void today_str(char *out, size_t n) {
    time_t now = time(NULL);
    strftime(out, n, "%Y-%m-%d", localtime(&now));
}

static void load_state(State *st) {
    memset(st, 0, sizeof *st);
    st->s.focus_min = 25; st->s.short_min = 5; st->s.long_min = 15;
    st->s.until_long = 4; st->s.sound = 1;
    strcpy(st->s.lang, "en");
    char *p = state_path();
    FILE *f = fopen(p, "r");
    g_free(p);
    if (!f) { strcpy(st->last_date, ""); strcpy(st->last_streak_date, ""); return; }
    fseek(f, 0, SEEK_END); long n = ftell(f); fseek(f, 0, SEEK_SET);
    char *buf = g_malloc(n + 1);
    if (fread(buf, 1, n, f) != (size_t)n) { fclose(f); g_free(buf); return; }
    buf[n] = 0; fclose(f);

    char lang[8] = "";
    if (sscanf(buf, "{\"settings\":{\"focus_min\":%d,\"short_min\":%d,\"long_min\":%d,\"until_long\":%d,\"lang\":\"%7[^\"]\"", 
               &st->s.focus_min, &st->s.short_min, &st->s.long_min, &st->s.until_long, lang) >= 5) {
        if (!strcmp(lang, "ar")) strcpy(st->s.lang, "ar");
    }
    char *sp = strstr(buf, "\"sound\":");
    if (sp) st->s.sound = atoi(sp + 8);

    char *t = strstr(buf, "\"tasks\":[");
    if (t) {
        t += 9;
        while (st->task_count < MAX_TASKS && (t = strstr(t, "{\"title\":\""))) {
            t += 10;
            char *end = strstr(t, "\",\"done\":");
            if (!end) break;
            size_t len = end - t; if (len > 255) len = 255;
            memcpy(st->tasks[st->task_count].title, t, len);
            st->tasks[st->task_count].title[len] = 0;
            st->tasks[st->task_count].done = atoi(end + 8);
            char *cp = strstr(end, ",\"category\":\"");
            if (cp && cp - end < 600) {
        cp += 13;
        char *ce = strchr(cp, '"');
        if (ce) { size_t cl = ce - cp; if (cl > 31) cl = 31;
            memcpy(st->tasks[st->task_count].category, cp, cl);
            st->tasks[st->task_count].category[cl] = 0; }
            }
            st->task_count++;
            t = end + 8;
        }
    }
    char *q;
    if ((q = strstr(buf, "\"active_task\":\""))) {
        q += 15;
        char *ae = strchr(q, '"');
        if (ae) { size_t al = ae - q; if (al > 127) al = 127;
            memcpy(st->active_task, q, al); st->active_task[al] = 0; }
    }
    if ((q = strstr(buf, "\"sessions_today\":"))) st->sessions_today = atoi(q + 16);
    if ((q = strstr(buf, "\"streak\":"))) st->streak = atoi(q + 9);
    if ((q = strstr(buf, "\"last_date\":\""))) { q += 13; sscanf(q, "%10[^\"]", st->last_date); }
    if ((q = strstr(buf, "\"last_streak_date\":\""))) { q += 19; sscanf(q, "%10[^\"]", st->last_streak_date); }
    if ((q = strstr(buf, "\"total_focus_seconds\":"))) st->total_focus_seconds = atoi(q + 21);
    char *ts = strstr(buf, "\"sessions\":[");
    if (ts) {
        ts += 11;
        while (st->session_count < 2000 && (ts = strstr(ts, "{\"date\":\""))) {
            ts += 9;
            SessRec *r = &st->sessions[st->session_count];
            char *e1 = strchr(ts, '"'); if (!e1) break;
            size_t dl = e1 - ts; if (dl > 10) dl = 10;
            memcpy(r->date, ts, dl); r->date[dl] = 0;
            char *m = strstr(e1, "\"mode\":"); if (!m) break;
            r->mode = atoi(m + 7);
            char *se = strstr(m, "\"seconds\":"); if (!se) break;
            r->seconds = atoi(se + 10);
            char *tk = strstr(se, "\"task\":\""); if (!tk) break;
            tk += 8;
            char *te = strchr(tk, '"');
            if (te) { size_t tl = te - tk; if (tl > 127) tl = 127; memcpy(r->task, tk, tl); r->task[tl] = 0; }
            st->session_count++;
            ts = te ? te : se;
        }
    }
    g_free(buf);
}

/* ---------- i18n ---------- */
static const char *tr(const char *key) {
    static const char *en[][2] = {
        {"focus","Focus"},{"short","Short break"},{"long","Long break"},
        {"start","Start"},{"pause","Pause"},{"reset","Reset"},{"skip","Skip"},
        {"tasks","Tasks"},{"add","Add"},{"settings","Settings"},
        {"sessions","Sessions today"},{"streak","Day streak"},
        {"empty","No tasks yet"},{"lang","Language"},{"mins","min"},
        {"focusLen","Focus length"},{"breakLen","Break length"},{"longLen","Long break"},
        {"untilLong","Sessions until long break"},{"sound","Sound"},
        {"done","Session complete!"},{"stats","Stats"},{"today","Today"},{"week","7 days"},{"total","Total"},{"history","History"},{"activeTask","Active task"},{"noTask","No task"},{"study","Study"},{"work","Work"},{"personal","Personal"},{"other","Other"},{NULL,NULL}
    };
    static const char *ar[][2] = {
        {"focus","تركيز"},{"short","استراحة قصيرة"},{"long","استراحة طويلة"},
        {"start","ابدأ"},{"pause","إيقاف"},{"reset","إعادة"},{"skip","تخطي"},
        {"tasks","المهام"},{"add","إضافة"},{"settings","الإعدادات"},
        {"sessions","جلسات اليوم"},{"streak","أيام متتالية"},
        {"empty","لا مهام بعد"},{"lang","اللغة"},{"mins","دقيقة"},
        {"focusLen","مدة التركيز"},{"breakLen","مدة الاستراحة"},{"longLen","الاستراحة الطويلة"},
        {"untilLong","جلسات قبل الاستراحة الطويلة"},{"sound","الصوت"},
        {"done","اكتملت الجلسة!"},{"stats","الإحصائيات"},{"today","اليوم"},{"week","7 أيام"},{"total","الإجمالي"},{"history","السجل"},{"activeTask","المهمة النشطة"},{"noTask","بدون مهمة"},{"study","دراسة"},{"work","عمل"},{"personal","شخصي"},{"other","أخرى"},{NULL,NULL}
    };
    const char *(*tbl)[2] = !strcmp(app.st.s.lang, "ar") ? ar : en;
    for (int i = 0; tbl[i][0]; i++) if (!strcmp(tbl[i][0], key)) return tbl[i][1];
    return key;
}

/* ---------- timer ---------- */
static int mode_seconds(App *a) {
    switch (a->mode) {
        case 0: return a->st.s.focus_min * 60;
        case 1: return a->st.s.short_min * 60;
        default: return a->st.s.long_min * 60;
    }
}

static void refresh_time_label(App *a) {
    char buf[16];
    snprintf(buf, sizeof buf, "%02d:%02d", a->remaining / 60, a->remaining % 60);
    gtk_label_set_text(GTK_LABEL(a->time_label), buf);
    if (a->progress) {
        int total = mode_seconds(a);
        double frac = total > 0 ? 1.0 - (double)a->remaining / total : 0.0;
        if (frac < 0) frac = 0; if (frac > 1) frac = 1;
        gtk_progress_bar_set_fraction(GTK_PROGRESS_BAR(a->progress), frac);
    }
}

static void refresh_stats(App *a) {
    char buf[160];
    snprintf(buf, sizeof buf, "%s: %d   |   %s: %d", tr("sessions"), a->st.sessions_today, tr("streak"), a->st.streak);
    gtk_label_set_text(GTK_LABEL(a->stats_label), buf);
}

static void record_session(App *a) {
    char today[11], yest[11];
    today_str(today, sizeof today);
    time_t yd = time(NULL) - 86400;
    strftime(yest, sizeof yest, "%Y-%m-%d", localtime(&yd));
    if (strcmp(a->st.last_date, today) != 0) {
        a->st.streak = !strcmp(a->st.last_streak_date, yest) ? a->st.streak + 1 : 1;
        strcpy(a->st.last_streak_date, yest);
        a->st.sessions_today = 0;
        strcpy(a->st.last_date, today);
    }
    a->st.sessions_today++;
    save_state(&a->st);
    refresh_stats(a);
}

static void complete_session(App *a) {
    a->running = 0;
    gtk_button_set_label(GTK_BUTTON(a->start_btn), tr("start"));
    if (a->mode == 0) {
        record_session(a);
        if (a->st.session_count < 2000) {
            SessRec *r = &a->st.sessions[a->st.session_count++];
            today_str(r->date, sizeof r->date);
            r->mode = 0; r->seconds = mode_seconds(a);
            /* attach active task title if set via entry */
            snprintf(r->task, sizeof r->task, "%s", a->st.active_task);
            a->st.total_focus_seconds += r->seconds;
        }
        a->sessions_in_cycle++;
        a->mode = (a->sessions_in_cycle % (a->st.s.until_long > 0 ? a->st.s.until_long : 4) == 0) ? 2 : 1;
    } else {
        a->mode = 0;
    }
    static const char *names[] = {"focus","short","long"};
    gtk_label_set_text(GTK_LABEL(a->mode_label), tr(names[a->mode]));
    a->remaining = mode_seconds(a);
    refresh_time_label(a);
    gtk_widget_add_css_class(a->time_label, "flash");
    g_timeout_add(1600, unflash_cb, a);
    if (a->st.s.sound) gdk_display_beep(gdk_display_get_default());
}

static gboolean tick_cb(gpointer data) {
    App *a = data;
    if (!a->running) return G_SOURCE_CONTINUE;
    time_t left = a->end_time - time(NULL);
    if (left <= 0) { complete_session(a); return G_SOURCE_CONTINUE; }
    a->remaining = (int)left;
    refresh_time_label(a);
    return G_SOURCE_CONTINUE;
}

/* ---------- callbacks ---------- */
static void on_start(GtkButton *b, gpointer d) {
    App *a = d; (void)b;
    if (a->running) {
        a->running = 0;
        a->remaining = (int)(a->end_time - time(NULL));
        if (a->remaining < 0) a->remaining = 0;
        gtk_button_set_label(GTK_BUTTON(a->start_btn), tr("start"));
    } else {
        a->running = 1;
        a->end_time = time(NULL) + a->remaining;
        gtk_button_set_label(GTK_BUTTON(a->start_btn), tr("pause"));
    }
    refresh_time_label(a);
}

static void on_reset(GtkButton *b, gpointer d) {
    App *a = d; (void)b;
    a->running = 0;
    a->remaining = mode_seconds(a);
    gtk_button_set_label(GTK_BUTTON(a->start_btn), tr("start"));
    refresh_time_label(a);
}

static void on_skip(GtkButton *b, gpointer d) { (void)b; complete_session(d); }

static void on_mode_toggled(GtkToggleButton *b, gpointer d) {
    App *a = d;
    if (!gtk_toggle_button_get_active(b)) return;
    const char *n = gtk_widget_get_name(GTK_WIDGET(b));
    a->mode = !strcmp(n, "m0") ? 0 : !strcmp(n, "m1") ? 1 : 2;
    static const char *names[] = {"focus","short","long"};
    gtk_label_set_text(GTK_LABEL(a->mode_label), tr(names[a->mode]));
    if (!a->running) { a->remaining = mode_seconds(a); refresh_time_label(a); }
}

static void refresh_tasks(App *a) {
    GtkWidget *child;
    while ((child = gtk_widget_get_first_child(a->task_list)))
        gtk_box_remove(GTK_BOX(a->task_list), child);
    for (int i = 0; i < a->st.task_count; i++) {
        GtkWidget *row = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 8);
        char lbl[300];
        if (a->st.tasks[i].category[0])
            snprintf(lbl, sizeof lbl, "%s  ·  %s", a->st.tasks[i].title, a->st.tasks[i].category);
        else
            snprintf(lbl, sizeof lbl, "%s", a->st.tasks[i].title);
        GtkWidget *check = gtk_check_button_new_with_label(lbl);
        gtk_check_button_set_active(GTK_CHECK_BUTTON(check), a->st.tasks[i].done);
        gtk_widget_set_hexpand(check, TRUE);
        g_object_set_data(G_OBJECT(check), "idx", GINT_TO_POINTER(i));
        g_signal_connect(check, "toggled", G_CALLBACK(check_toggled), a);
        GtkWidget *del = gtk_button_new_from_icon_name("user-trash-symbolic");
        gtk_widget_add_css_class(del, "flat");
        g_object_set_data(G_OBJECT(del), "idx", GINT_TO_POINTER(i));
        g_signal_connect(del, "clicked", G_CALLBACK(task_deleted), a);
        gtk_box_append(GTK_BOX(row), check);
        gtk_box_append(GTK_BOX(row), del);
        gtk_box_append(GTK_BOX(a->task_list), row);
    }
    gtk_widget_set_visible(a->tasks_empty, a->st.task_count == 0);
    sync_active_btn(a);
}

static void check_toggled(GtkCheckButton *c, gpointer d) {
    App *a = d;
    int i = GPOINTER_TO_INT(g_object_get_data(G_OBJECT(c), "idx"));
    a->st.tasks[i].done = gtk_check_button_get_active(c);
    save_state(&a->st);
}

static void task_deleted(GtkButton *b, gpointer d) {
    App *a = d;
    int i = GPOINTER_TO_INT(g_object_get_data(G_OBJECT(b), "idx"));
    memmove(&a->st.tasks[i], &a->st.tasks[i+1], (a->st.task_count - i - 1) * sizeof(Task));
    a->st.task_count--;
    save_state(&a->st);
    refresh_tasks(a);
}

static void on_add_task(GtkButton *b, gpointer d) {
    App *a = d; (void)b;
    const char *t = gtk_editable_get_text(GTK_EDITABLE(a->task_entry));
    while (t && (*t == ' ' || *t == '\t')) t++;
    if (!t || !*t || a->st.task_count >= MAX_TASKS) return;
    g_strlcpy(a->st.tasks[a->st.task_count].title, t, sizeof a->st.tasks[0].title);
    a->st.tasks[a->st.task_count].done = 0;
    g_strlcpy(a->st.tasks[a->st.task_count].category, CATS[a->cat_sel], 32);
    g_strlcpy(a->st.active_task, a->st.tasks[a->st.task_count].title, sizeof a->st.active_task);
    a->st.task_count++;
    save_state(&a->st);
    gtk_editable_set_text(GTK_EDITABLE(a->task_entry), "");
    refresh_tasks(a);
}

static void on_entry_activate(GtkEntry *e, gpointer d) { (void)e; on_add_task(NULL, d); }

/* stepper rows in settings */
typedef struct { const char *label_key; int *field; int lo, hi; GtkWidget *val; } StepRow;
static StepRow step_rows[3];

static void step_changed(GtkButton *b, gpointer d) {
    App *a = d; (void)b;
    int idx = GPOINTER_TO_INT(g_object_get_data(G_OBJECT(GTK_WIDGET(gtk_widget_get_parent(GTK_WIDGET(b)))), "ridx"));
    int delta = !strcmp(gtk_widget_get_name(GTK_WIDGET(b)), "plus") ? 1 : -1;
    int *f = step_rows[idx].field;
    *f += delta;
    if (*f < step_rows[idx].lo) *f = step_rows[idx].lo;
    if (*f > step_rows[idx].hi) *f = step_rows[idx].hi;
    char vb[16]; snprintf(vb, sizeof vb, "%d", *f);
    gtk_label_set_text(GTK_LABEL(step_rows[idx].val), vb);
    save_state(&a->st);
    if (idx == 0 || idx == 1 || idx == 2) {
        /* update live durations when not running */
        if (!a->running) { a->remaining = mode_seconds(a); refresh_time_label(a); }
    }
}

static void cat_toggled(GtkCheckButton *c, gpointer d) {
    App *a = d;
    if (!gtk_check_button_get_active(c)) return;
    for (int i = 0; i < 4; i++) {
        if (a->cat_btns[i] != GTK_WIDGET(c))
            gtk_check_button_set_active(GTK_CHECK_BUTTON(a->cat_btns[i]), FALSE);
    }
    for (int i = 0; i < 4; i++)
        if (a->cat_btns[i] == GTK_WIDGET(c)) { a->cat_sel = i; break; }
    save_state(&a->st);
}

static void active_task_cycle(GtkButton *b, gpointer d) {
    App *a = d; (void)b;
    /* cycle: none -> task0 -> task1 ... -> none */
    int idx = -1;
    for (int i = 0; i < a->st.task_count; i++)
        if (!strcmp(a->st.tasks[i].title, a->st.active_task)) { idx = i; break; }
    idx++;
    if (idx >= a->st.task_count) idx = -1;
    if (idx < 0) a->st.active_task[0] = 0;
    else g_strlcpy(a->st.active_task, a->st.tasks[idx].title, sizeof a->st.active_task);
    gtk_button_set_label(GTK_BUTTON(a->active_btn),
        a->st.active_task[0] ? a->st.active_task : tr("noTask"));
}

static void sync_active_btn(App *a) {
    if (a->active_btn)
        gtk_button_set_label(GTK_BUTTON(a->active_btn),
            a->st.active_task[0] ? a->st.active_task : tr("noTask"));
}

static void on_lang_toggled(GtkCheckButton *c, gpointer d) {
    App *a = d;
    if (!gtk_check_button_get_active(c)) return;
    const char *l = gtk_check_button_get_label(c);
    strcpy(a->st.s.lang, strstr(l, "العربية") ? "ar" : "en");
    save_state(&a->st);
    rebuild_ui(a);
}

/* ---------- pages ---------- */
static GtkWidget *build_focus_page(App *a) {
    GtkWidget *box = gtk_box_new(GTK_ORIENTATION_VERTICAL, 20);
    gtk_widget_set_margin_start(box, 32); gtk_widget_set_margin_end(box, 32);
    gtk_widget_set_margin_top(box, 32); gtk_widget_set_margin_bottom(box, 32);
    gtk_widget_set_vexpand(box, TRUE);

    GtkWidget *modes = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 8);
    gtk_widget_set_halign(modes, GTK_ALIGN_CENTER);
    static const char *names[] = {"focus","short","long"};
    for (int i = 0; i < 3; i++) {
        GtkWidget *r = gtk_check_button_new_with_label(tr(names[i]));
        gtk_widget_set_name(r, i == 0 ? "m0" : i == 1 ? "m1" : "m2");
        gtk_widget_add_css_class(r, "pill");
        if (i == a->mode) gtk_check_button_set_active(GTK_CHECK_BUTTON(r), TRUE);
        g_signal_connect(r, "toggled", G_CALLBACK(on_mode_toggled), a);
        gtk_box_append(GTK_BOX(modes), r);
    }
    gtk_box_append(GTK_BOX(box), modes);

    a->mode_label = gtk_label_new(tr(names[a->mode]));
    gtk_widget_add_css_class(a->mode_label, "title-2");
    gtk_box_append(GTK_BOX(box), a->mode_label);

    a->time_label = gtk_label_new("00:00");
    gtk_widget_add_css_class(a->time_label, "time-digits");
    gtk_box_append(GTK_BOX(box), a->time_label);

    a->progress = gtk_progress_bar_new();
    gtk_widget_add_css_class(a->progress, "timer-progress");
    gtk_widget_set_size_request(a->progress, 320, -1);
    gtk_box_append(GTK_BOX(box), a->progress);

    GtkWidget *controls = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 12);
    gtk_widget_set_halign(controls, GTK_ALIGN_CENTER);
    GtkWidget *reset = gtk_button_new_with_label(tr("reset"));
    g_signal_connect(reset, "clicked", G_CALLBACK(on_reset), a);
    a->start_btn = gtk_button_new_with_label(tr("start"));
    gtk_widget_add_css_class(a->start_btn, "suggested-action");
    g_signal_connect(a->start_btn, "clicked", G_CALLBACK(on_start), a);
    GtkWidget *skip = gtk_button_new_with_label(tr("skip"));
    g_signal_connect(skip, "clicked", G_CALLBACK(on_skip), a);
    gtk_box_append(GTK_BOX(controls), reset);
    gtk_box_append(GTK_BOX(controls), a->start_btn);
    gtk_box_append(GTK_BOX(controls), skip);
    gtk_box_append(GTK_BOX(box), controls);

    a->active_btn = gtk_button_new_with_label(tr("noTask"));
    gtk_widget_add_css_class(a->active_btn, "flat");
    g_signal_connect(a->active_btn, "clicked", G_CALLBACK(active_task_cycle), a);
    gtk_box_append(GTK_BOX(box), a->active_btn);
    sync_active_btn(a);

    a->stats_label = gtk_label_new("");
    gtk_widget_add_css_class(a->stats_label, "caption");
    gtk_widget_set_halign(a->stats_label, GTK_ALIGN_CENTER);
    gtk_box_append(GTK_BOX(box), a->stats_label);
    refresh_stats(a);
    refresh_time_label(a);
    return box;
}

static GtkWidget *build_tasks_page(App *a) {
    GtkWidget *box = gtk_box_new(GTK_ORIENTATION_VERTICAL, 12);
    gtk_widget_set_margin_start(box, 24); gtk_widget_set_margin_end(box, 24);
    gtk_widget_set_margin_top(box, 24); gtk_widget_set_margin_bottom(box, 24);

    GtkWidget *row = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 8);
    a->task_entry = gtk_entry_new();
    gtk_entry_set_placeholder_text(GTK_ENTRY(a->task_entry), tr("add"));
    gtk_widget_set_hexpand(a->task_entry, TRUE);
    g_signal_connect(a->task_entry, "activate", G_CALLBACK(on_entry_activate), a);
    GtkWidget *add = gtk_button_new_with_label(tr("add"));
    gtk_widget_add_css_class(add, "suggested-action");
    g_signal_connect(add, "clicked", G_CALLBACK(on_add_task), a);
    gtk_box_append(GTK_BOX(row), a->task_entry);
    gtk_box_append(GTK_BOX(row), add);
    gtk_box_append(GTK_BOX(box), row);

    GtkWidget *catrow = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 6);
    gtk_widget_set_halign(catrow, GTK_ALIGN_START);
    for (int i = 0; i < 4; i++) {
        GtkWidget *ch = gtk_check_button_new_with_label(tr(CATS[i]));
        gtk_widget_add_css_class(ch, "cat-chip");
        gtk_widget_set_name(ch, "cat");
        if (i == a->cat_sel) gtk_check_button_set_active(GTK_CHECK_BUTTON(ch), TRUE);
        g_signal_connect(ch, "toggled", G_CALLBACK(cat_toggled), a);
        a->cat_btns[i] = ch;
        gtk_box_append(GTK_BOX(catrow), ch);
    }
    gtk_box_append(GTK_BOX(box), catrow);

    GtkWidget *scroll = gtk_scrolled_window_new();
    gtk_widget_set_vexpand(scroll, TRUE);
    a->task_list = gtk_box_new(GTK_ORIENTATION_VERTICAL, 4);
    gtk_scrolled_window_set_child(GTK_SCROLLED_WINDOW(scroll), a->task_list);
    gtk_box_append(GTK_BOX(box), scroll);

    a->tasks_empty = gtk_label_new(tr("empty"));
    gtk_widget_set_halign(a->tasks_empty, GTK_ALIGN_CENTER);
    gtk_widget_add_css_class(a->tasks_empty, "dim-label");
    gtk_box_append(GTK_BOX(box), a->tasks_empty);

    refresh_tasks(a);
    return box;
}

static GtkWidget *build_settings_page(App *a) {
    GtkWidget *box = gtk_box_new(GTK_ORIENTATION_VERTICAL, 12);
    gtk_widget_set_margin_start(box, 24); gtk_widget_set_margin_end(box, 24);
    gtk_widget_set_margin_top(box, 24);
    gtk_widget_set_size_request(box, 480, -1);

    GtkWidget *lang_lbl = gtk_label_new(tr("lang"));
    gtk_widget_set_halign(lang_lbl, GTK_ALIGN_START);
    gtk_box_append(GTK_BOX(box), lang_lbl);
    GtkWidget *lang_row = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 8);
    const char *lnames[] = {"English", "العربية"};
    for (int i = 0; i < 2; i++) {
        GtkWidget *r = gtk_check_button_new_with_label(lnames[i]);
        if ((!strcmp(a->st.s.lang, "ar")) == (i == 1))
            gtk_check_button_set_active(GTK_CHECK_BUTTON(r), TRUE);
        g_signal_connect(r, "toggled", G_CALLBACK(on_lang_toggled), a);
        gtk_box_append(GTK_BOX(lang_row), r);
    }
    gtk_box_append(GTK_BOX(box), lang_row);

    /* duration steppers */
    struct { const char *key; int *field; int lo, hi; } defs[] = {
        {"focusLen", &a->st.s.focus_min, 1, 120},
        {"breakLen", &a->st.s.short_min, 1, 60},
        {"longLen",  &a->st.s.long_min, 1, 120},
    };
    for (int i = 0; i < 3; i++) {
        step_rows[i].label_key = defs[i].key;
        step_rows[i].field = defs[i].field;
        step_rows[i].lo = defs[i].lo;
        step_rows[i].hi = defs[i].hi;

        GtkWidget *r = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 8);
        GtkWidget *lbl = gtk_label_new(tr(defs[i].key));
        gtk_widget_set_hexpand(lbl, TRUE);
        gtk_widget_set_halign(lbl, GTK_ALIGN_START);
        GtkWidget *minus = gtk_button_new_with_label("−");
        gtk_widget_set_name(minus, "minus");
        GtkWidget *plus = gtk_button_new_with_label("+");
        gtk_widget_set_name(plus, "plus");
        GtkWidget *val = gtk_label_new("");
        char vb[16]; snprintf(vb, sizeof vb, "%d %s", *defs[i].field, tr("mins"));
        gtk_label_set_text(GTK_LABEL(val), vb);
        step_rows[i].val = val;
        g_object_set_data(G_OBJECT(r), "ridx", GINT_TO_POINTER(i));
        g_signal_connect(minus, "clicked", G_CALLBACK(step_changed), a);
        g_signal_connect(plus, "clicked", G_CALLBACK(step_changed), a);
        gtk_box_append(GTK_BOX(r), lbl);
        gtk_box_append(GTK_BOX(r), minus);
        gtk_box_append(GTK_BOX(r), val);
        gtk_box_append(GTK_BOX(r), plus);
        gtk_box_append(GTK_BOX(box), r);
    }

    /* sound toggle */
    GtkWidget *snd = gtk_check_button_new_with_label(tr("sound"));
    gtk_check_button_set_active(GTK_CHECK_BUTTON(snd), a->st.s.sound);
    g_signal_connect(snd, "toggled", G_CALLBACK(snd_toggled), a);
    gtk_box_append(GTK_BOX(box), snd);
    return box;
}

static void snd_toggled(GtkCheckButton *c, gpointer d) {
    App *a = d;
    a->st.s.sound = gtk_check_button_get_active(c);
    save_state(&a->st);
}

/* ---------- shell ---------- */
static void rebuild_ui(App *a) {
    if (!a->window) return;
    gtk_window_set_child(GTK_WINDOW(a->window), NULL);

    GtkWidget *outer = gtk_box_new(GTK_ORIENTATION_VERTICAL, 0);
    AdwHeaderBar *header = ADW_HEADER_BAR(adw_header_bar_new());
    static const char *tab_keys[] = {"focus", "tasks", "stats", "settings"};
    static const char *tab_icons[] = {"media-playback-start-symbolic", "view-list-symbolic", "view-chart-symbolic", "open-menu-symbolic"};
    a->stack = gtk_stack_new();
    GtkWidget *pages[4];
    for (int i = 0; i < 4; i++) {
        pages[i] = i == 0 ? build_focus_page(a) : i == 1 ? build_tasks_page(a) : i == 2 ? build_stats_page(a) : build_settings_page(a);
        char id[8]; snprintf(id, sizeof id, "p%d", i);
        gtk_stack_add_named(GTK_STACK(a->stack), pages[i], id);
    }
    gtk_widget_set_vexpand(a->stack, TRUE);
    gtk_stack_set_transition_type(GTK_STACK(a->stack), GTK_STACK_TRANSITION_TYPE_CROSSFADE);
    gtk_stack_set_transition_duration(GTK_STACK(a->stack), 180);
    for (int i = 0; i < 4; i++) {
        GtkWidget *btn = gtk_toggle_button_new();
        GtkWidget *img = gtk_image_new_from_icon_name(tab_icons[i]);
        GtkWidget *lbl = gtk_label_new(tr(tab_keys[i]));
        GtkWidget *h = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 6);
        gtk_box_append(GTK_BOX(h), img);
        gtk_box_append(GTK_BOX(h), lbl);
        gtk_button_set_child(GTK_BUTTON(btn), h);
        gtk_widget_set_name(btn, i == 0 ? "t0" : i == 1 ? "t1" : i == 2 ? "t2" : "t3");
        g_signal_connect(btn, "toggled", G_CALLBACK(on_tab_toggled), a);
        if (i == 0) gtk_toggle_button_set_active(GTK_TOGGLE_BUTTON(btn), TRUE);
        adw_header_bar_pack_start(header, btn);
        a->tab_btns[i] = btn;
    }
    gtk_box_append(GTK_BOX(outer), GTK_WIDGET(header));
    gtk_box_append(GTK_BOX(outer), a->stack);
    gtk_window_set_child(GTK_WINDOW(a->window), outer);
    gtk_widget_set_direction(outer, !strcmp(a->st.s.lang, "ar") ? GTK_TEXT_DIR_RTL : GTK_TEXT_DIR_LTR);
    gtk_stack_set_visible_child_name(GTK_STACK(a->stack), "p0");
}

static GtkWidget *build_stats_page(App *a) {
    GtkWidget *box = gtk_box_new(GTK_ORIENTATION_VERTICAL, 16);
    gtk_widget_set_margin_start(box, 24); gtk_widget_set_margin_end(box, 24);
    gtk_widget_set_margin_top(box, 24);

    int today_s = 0, week_s = 0;
    char today[11]; today_str(today, sizeof today);
    char week_ago[11];
    { time_t t = time(NULL) - 7*86400; strftime(week_ago, sizeof week_ago, "%Y-%m-%d", localtime(&t)); }
    for (int i = 0; i < a->st.session_count; i++) {
        SessRec *r = &a->st.sessions[i];
        if (r->mode != 0) continue;
        if (!strcmp(r->date, today)) today_s += r->seconds;
        if (strcmp(r->date, week_ago) >= 0) week_s += r->seconds;
    }
    char b1[64], b2[64], b3[64];
    snprintf(b1, sizeof b1, "%s: %d:%02d", tr("today"), today_s/60, today_s%60);
    snprintf(b2, sizeof b2, "%s: %d:%02d", tr("week"), week_s/60, week_s%60);
    snprintf(b3, sizeof b3, "%s: %d:%02d   |   %s: %d", tr("total"), a->st.total_focus_seconds/3600, (a->st.total_focus_seconds%3600)/60, tr("streak"), a->st.streak);
    GtkWidget *l1 = gtk_label_new(b1); gtk_widget_add_css_class(l1, "title-3");
    GtkWidget *l2 = gtk_label_new(b2); gtk_widget_add_css_class(l2, "title-3");
    GtkWidget *l3 = gtk_label_new(b3); gtk_widget_add_css_class(l3, "caption");
    gtk_box_append(GTK_BOX(box), l1); gtk_box_append(GTK_BOX(box), l2); gtk_box_append(GTK_BOX(box), l3);

    GtkWidget *lbl = gtk_label_new(tr("history"));
    gtk_widget_set_halign(lbl, GTK_ALIGN_START);
    gtk_box_append(GTK_BOX(box), lbl);

    GtkWidget *scroll = gtk_scrolled_window_new();
    gtk_widget_set_vexpand(scroll, TRUE);
    GtkWidget *list = gtk_box_new(GTK_ORIENTATION_VERTICAL, 4);
    gtk_scrolled_window_set_child(GTK_SCROLLED_WINDOW(scroll), list);
    for (int i = a->st.session_count - 1; i >= 0 && i > a->st.session_count - 200; i--) {
        SessRec *r = &a->st.sessions[i];
        char line[400];
        snprintf(line, sizeof line, "%s  %s  %d:%02d  %s", r->date, r->mode==0?"focus":"break", r->seconds/60, r->seconds%60, r->task);
        GtkWidget *l = gtk_label_new(line);
        gtk_widget_set_halign(l, GTK_ALIGN_START);
        gtk_box_append(GTK_BOX(list), l);
    }
    gtk_box_append(GTK_BOX(box), scroll);
    return box;
}

static void on_tab_toggled(GtkToggleButton *b, gpointer d) {
    App *a = d;
    if (!gtk_toggle_button_get_active(b)) return;
    const char *n = gtk_widget_get_name(GTK_WIDGET(b));
    gtk_stack_set_visible_child_name(GTK_STACK(a->stack),
        !strcmp(n, "t0") ? "p0" : !strcmp(n, "t1") ? "p1" : !strcmp(n, "t2") ? "p2" : "p3");
}

static void on_activate(GtkApplication *adw, gpointer d) {
    App *a = d;
    if (!a->window) {
        a->window = gtk_application_window_new(adw);
        gtk_window_set_default_size(GTK_WINDOW(a->window), 480, 720);
        gtk_window_set_title(GTK_WINDOW(a->window), "Focus Plan");
        rebuild_ui(a);
    }
    gtk_window_present(GTK_WINDOW(a->window));
}

int main(int argc, char **argv) {
    memset(&app, 0, sizeof app);
    load_state(&app.st);
    app.remaining = mode_seconds(&app);

    load_css();
    GtkApplication *gapp = gtk_application_new("com.focusplan.app", G_APPLICATION_FLAGS_NONE);
    g_signal_connect(gapp, "activate", G_CALLBACK(on_activate), &app);
    g_timeout_add_seconds(1, tick_cb, &app);
    return g_application_run(G_APPLICATION(gapp), argc, argv);
}
