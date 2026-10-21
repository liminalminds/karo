package main

import (
	"html/template"
	"log/slog"
	"net/http"
	"regexp"
	"strings"
)

var templates = template.Must(template.ParseGlob("templates/**/*.html"))

// notFound renders the fallback page with a real 404, which matters because
// pages are still being written: a stub route should not look like a hit.
func notFound(w http.ResponseWriter, name string) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusNotFound)
	if err := templates.ExecuteTemplate(w, "not-found", nil); err != nil {
		slog.Error("Template Error", "template", "not-found", "msg", err.Error())
	}
}

func tmpl(w http.ResponseWriter, name string, data any) {
	if templates.Lookup(name) == nil {
		slog.Warn("Template Missing", "template", name)
		notFound(w, name)
		return
	}
	// The header has to be set before the status line, otherwise it is ignored
	// and the browser guesses the content type instead.
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	if err := templates.ExecuteTemplate(w, name, data); err != nil {
		slog.Error("Template Error", "template", name, "msg", err.Error())
	}
}

// One item pulled out of a rant: what Karo thinks it is, when it is due, and
// which tag it was filed under.
type parsedItem struct {
	Kind string
	Text string
	When string
	Tag  string
}

var (
	// "@work" or "#work" anywhere in the sentence.
	tagRe = regexp.MustCompile(`[@#]([A-Za-z][\w-]*)`)
	// Habits are the recurring asks: they never have a single due date.
	habitRe = regexp.MustCompile(`(?i)\b(every ?day|every ?morning|every ?night|daily|each day|weekly|every week|every monday|monthly)\b`)
	// Everything else with a time word in it lands on the calendar.
	whenRe = regexp.MustCompile(`(?i)\b(today|tonight|this morning|this afternoon|tomorrow|tuesday|wednesday|thursday|friday|saturday|sunday|monday|next week|end of (?:day|week|month))\b`)
	// Opening verbs are the clearest signal that a clause is an action. Without one
	// of these, a clause is commentary about the rant rather than a thing to do.
	verbRe = regexp.MustCompile(`(?i)\b(ask|asks|block|book|books|buy|call|calls|cancel|catch|charge|check|clean|cleans|collect|confirm|cook|deliver|deploy|do|download|draft|dry|email|emails|examine|exercise|expire|expires|extend|fetch|file|files|finish|fix|fixes|follow up|get|gets|grab|gather|hand|help|hold|invite|join|launch|make|measure|meet|meditate|merge|message|move|order|orders|organise|organize|pay|pays|pick up|pickup|plan|post|prep|prepare|present|print|proofread|propose|pull|push|push back|put|read|reads|rebuild|recall|remind|renew|reply|replace|restock|return|review|run|runs|schedule|score|send|sends|ship|ships|shop|sign|sort|start|stop|stretch|submit|submits|summarise|summarize|swap|sync|test|thank|text|tidy|top up|track|transfer|try|update|upgrade|vacuum|visit|walk|walks|wash|water|weigh|wind|work|works|wrap up|write|writes|yoga)\b`)
	// Fillers that open a spoken thought. Removed from the front, one at a
	// time, so what is left reads like something a person would have typed.
	fillerRe = regexp.MustCompile(`(?i)^(?:ok|okay|ugh|so|and|also|then|plus|alright|right|first|next|now|honestly|basically|really|anyway|anyways|at this point|i need to|i have to|i should|i want to|i must|i need|i have to|need to|have to|gotta|remember to|do not forget to|don't forget to|make sure to|remember|have|do)\b[\s,]*`)
	// Trailing conjunctions and prepositions left behind once a time phrase or
	// a clause is removed: "ship it before friday" ends with a dangling "before".
	tailRe = regexp.MustCompile(`(?i)[\s,]*(?:and|but|then|so|plus|also|as well as|before|by|on|at|in|for|after|around|about)$`)
	// Clause boundaries. RE2 has no lookbehind, so the split is done on the
	// separator itself: newlines, sentence punctuation, or a comma and space.
	splitRe = regexp.MustCompile(`(?:\r?\n)+|[.!?;:]+(?:\s+|$)|,\s+`)
	// A clause that opens with a pronoun is the speaker talking about their day,
	// not an instruction to the app.
	pronounRe = regexp.MustCompile(`(?i)^(?:i|we|you|they|he|she|it|this|that|there|these|those)\b`)
)

var weekDays = map[string]string{
	"monday": "Monday", "tuesday": "Tuesday", "wednesday": "Wednesday",
	"thursday": "Thursday", "friday": "Friday", "saturday": "Saturday",
	"sunday": "Sunday",
}

// kindOf decides whether a sentence is a habit or a task. A sentence only
// becomes a habit when it says so, because a one-off that happens to be
// written as "buy milk every day" should still be a task until proven otherwise.
func kindOf(sentence string) string {
	if habitRe.MatchString(sentence) {
		return "habit"
	}
	return "task"
}

func normalizeKind(kind string) string {
	if kind == "habit" {
		return "Habit"
	}
	return "Task"
}

// whenOf returns the cleaned time phrase, if any, and the sentence without it.
func whenOf(sentence string) (string, string) {
	match := whenRe.FindString(sentence)
	if match == "" {
		return "", sentence
	}
	if canonical, ok := weekDays[strings.ToLower(match)]; ok {
		match = canonical
	} else {
		match = strings.ToUpper(match[:1]) + match[1:]
	}
	return match, strings.TrimSpace(whenRe.ReplaceAllString(sentence, ""))
}

func tagOf(sentence string) (string, string) {
	match := tagRe.FindStringSubmatch(sentence)
	if match == nil {
		return "", sentence
	}
	return strings.ToLower(match[1]), strings.ReplaceAll(sentence, match[0], "")
}

// hasSignal reports whether a clause is worth tracking on its own, which is how
// commas inside a single thought stay in the same item. A time word on its own
// is not enough: "ugh I don't want to do this today" mentions today and means
// nothing by it, so an action word or an explicit tag is what counts.
func hasSignal(clause string) bool {
	return verbRe.MatchString(clause) || habitRe.MatchString(clause) ||
		tagRe.MatchString(clause)
}

// tidy strips the spoken furniture from a clause.
func tidy(clause string) string {
	clause = strings.TrimSpace(clause)
	for {
		trimmed := fillerRe.ReplaceAllString(clause, "")
		if trimmed == clause {
			break
		}
		clause = trimmed
	}
	clause = tagRe.ReplaceAllString(clause, "")
	clause = tailRe.ReplaceAllString(clause, "")
	clause = strings.Trim(strings.Join(strings.Fields(clause), " "), " ,;:-–—")
	return clause
}

// titleOf turns a clause into a display title: no leading filler, no trailing
// conjunctions, first letter capitalised.
func titleOf(clause string) string {
	s := tidy(clause)
	if s == "" {
		return ""
	}
	return strings.ToUpper(s[:1]) + s[1:]
}

// trackable decides whether a clause becomes an item. An explicit recurrence or
// tag is proof enough on its own; otherwise the clause needs an action word and
// must not read like a remark about the rant.
func trackable(clause string) bool {
	if !hasSignal(clause) {
		return false
	}
	if habitRe.MatchString(clause) || tagRe.MatchString(clause) {
		return true
	}
	return !pronounRe.MatchString(tidy(clause))
}

// splitClauses breaks a rant into pieces and merges the ones that are clearly
// continuations, so "call the landlord, email Dana and buy milk" becomes three
// items instead of one long one.
func splitClauses(rant string) []string {
	clauses := []string{}
	current := ""

	flush := func() {
		if current != "" {
			clauses = append(clauses, current)
			current = ""
		}
	}

	for _, part := range splitRe.Split(rant, -1) {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		if current == "" {
			current = part
			continue
		}
		// A clause starts a new item when it looks like one on its own;
		// otherwise it is a continuation of what came before.
		if hasSignal(part) {
			flush()
			current = part
		} else {
			current += " " + part
		}
	}
	flush()

	return clauses
}

// parseRant is a deliberately small stand-in for the real extraction step. It
// shows the shape of the pipeline in the app: text in, structured items out.
func parseRant(rant string) []parsedItem {
	seen := map[string]bool{}
	items := []parsedItem{}

	for _, clause := range splitClauses(rant) {
		kind := kindOf(clause)
		if !trackable(clause) {
			continue
		}

		// The time phrase belongs in the due column, not in the title.
		when, rest := whenOf(clause)
		tag, _ := tagOf(clause)
		text := titleOf(rest)
		if text == "" {
			text = titleOf(clause)
		}
		if text == "" {
			continue
		}

		key := strings.ToLower(text)
		if seen[key] {
			continue
		}
		seen[key] = true

		items = append(items, parsedItem{
			Kind: normalizeKind(kind),
			Text: text,
			When: when,
			Tag:  tag,
		})
		if len(items) == 8 {
			break
		}
	}
	return items
}

func rantDemo(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		tmpl(w, "rant-error", "Could not read that rant.")
		return
	}

	rant := strings.TrimSpace(r.PostFormValue("rant"))
	if rant == "" {
		tmpl(w, "rant-error", "Rant first, then Karo takes it from there.")
		return
	}

	items := parseRant(rant)
	habits := 0
	for _, item := range items {
		if item.Kind == "Habit" {
			habits++
		}
	}

	slog.Info("Rant demo", "chars", len(rant), "items", len(items))
	tmpl(w, "rant-result", map[string]any{
		"Rant":   rant,
		"Items":  items,
		"Habits": habits,
		"Tasks":  len(items) - habits,
	})
}

// One step of the "how it works" walkthrough. Kept in Go so the template stays
// pure markup and each step is fetched on its own by htmx.
type stepInfo struct {
	Tag   string
	Title string
	Body  string
}

var steps = map[string]stepInfo{
	"1": {
		Tag:   "01",
		Title: "Say it the messy way",
		Body: "Hold the phone, rant for forty seconds, stop caring about grammar. " +
			"Karo captures the audio and writes the transcript at the same time, so nothing " +
			"is lost between the thought and the list.",
	},
	"2": {
		Tag:   "02",
		Title: "Karo picks out the actions",
		Body: "The transcript is split into candidate items. Recurring lines become habits, " +
			"anything with a time word lands on the calendar, and every tag you mention is " +
			"attached to the item you mentioned it on.",
	},
	"3": {
		Tag:   "03",
		Title: "You confirm, not type",
		Body: "Review the draft, drop what is not real, and Karo files the rest. Confirming a " +
			"dozen things takes seconds, which is the only reason a list survives contact " +
			"with a real week.",
	},
	"4": {
		Tag:   "04",
		Title: "The app keeps the score",
		Body: "Habits close out each day into a frozen snapshot, streaks build only from days " +
			"you actually finished, and missed days show up before they disappear.",
	},
}

// Short answers, keyed by the question id used in the page.
var faqAnswers = map[string]string{
	"data": "Your tasks, habits, tags, history and voice notes are stored in a database on " +
		"the device. Only a recording you explicitly send for analysis leaves it, and the " +
		"transcript is produced on device.",
	"ai": "The extraction step is the part that reads a rant and turns it into candidate " +
		"tasks and habits. Karo shows you what it found before anything is saved, so you " +
		"stay the one deciding what counts.",
	"habits": "Habits close out into a snapshot when the day ends. A day counts only when " +
		"every habit expected that day was finished, so adding a habit today cannot " +
		"retroactively wreck an old streak.",
	"groups": "Lists are the shared surface: group anything with tags, keep separate lists " +
		"for work, home or a project, and open them as checklists that are independent of " +
		"your daily tasks.",
	"goals": "Long goals are expressed as recurring habits with a count. Water eight times " +
		"a day is one habit with a target, not eight taps, and history shows whether you " +
		"actually hit it.",
	"price": "The app runs on its own. Analysis of recordings is the paid part, because " +
		"that is the only feature that costs Karo anything to serve.",
}

func main() {
	port := "5000"
	mux := http.NewServeMux()
	fs := http.FileServer(http.Dir("./static"))
	mux.Handle("/static/", http.StripPrefix("/static/", fs))

	router := map[string]string{
		"/":              "index",
		"/pricing":       "pricing",
		"/about":         "about",
		"/legal/privacy": "privacy",
		"/legal/terms":   "terms",
	}

	for route, page := range router {
		mux.HandleFunc(route, func(w http.ResponseWriter, r *http.Request) {
			slog.Info("View", "page", page, "fingerprint", r.RemoteAddr)
			tmpl(w, page, nil)
		})
	}

	// htmx swaps: each endpoint returns a bare fragment, never a full page.
	mux.HandleFunc("GET /fragments/features", func(w http.ResponseWriter, r *http.Request) {
		tmpl(w, "features-extra", nil)
	})

	mux.HandleFunc("GET /fragments/how/{step}", func(w http.ResponseWriter, r *http.Request) {
		key := r.PathValue("step")
		step, ok := steps[key]
		if !ok {
			step = stepInfo{Tag: "--", Title: "That step is not here",
				Body: "Pick one of the tabs above to walk through the flow."}
		}
		tmpl(w, "how-step", map[string]any{"Step": step})
	})

	mux.HandleFunc("GET /fragments/faq/{q}", func(w http.ResponseWriter, r *http.Request) {
		key := r.PathValue("q")
		answer, ok := faqAnswers[key]
		if !ok {
			answer = "We have not written that one down yet."
		}
		tmpl(w, "faq-answer", map[string]any{"Answer": answer})
	})

	mux.HandleFunc("POST /demo/rant", rantDemo)

	slog.Info("Server Started", "port", port)
	err := http.ListenAndServe(":"+port, mux)
	if err != nil {
		slog.Error("Server Failed To Start", "msg", err.Error())
	}
}
