package main

import (
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"

	supabase "github.com/nedpals/supabase-go"
	"gopkg.in/yaml.v3"
)

type Ability struct {
	Score    int  `yaml:"score" json:"score"`
	Mod      int  `yaml:"mod" json:"mod"`
	SaveProf bool `yaml:"save_prof" json:"save_prof"`
}

type Skill struct {
	Mod       int  `yaml:"mod" json:"mod"`
	Prof      bool `yaml:"prof" json:"prof"`
	Expertise bool `yaml:"expertise" json:"expertise"`
}

type Feature struct {
	Name        string `yaml:"name" json:"name"`
	Description string `yaml:"description" json:"description"`
}

type Character struct {
	Header struct {
		Name       string `yaml:"name" json:"name"`
		ClassLevel string `yaml:"class_level" json:"class_level"`
		Background string `yaml:"background" json:"background"`
		Race       string `yaml:"race" json:"race"`
		Alignment  string `yaml:"alignment" json:"alignment"`
	} `yaml:"header" json:"header"`
	Abilities map[string]Ability `yaml:"abilities" json:"abilities"`
	Vitals    struct {
		ProficiencyBonus int    `yaml:"proficiency_bonus" json:"proficiency_bonus"`
		AC               int    `yaml:"ac" json:"ac"`
		Initiative       int    `yaml:"initiative" json:"initiative"`
		Speed            int    `yaml:"speed" json:"speed"`
		HPMax            int    `yaml:"hp_max" json:"hp_max"`
		HPCurrent        int    `yaml:"hp_current" json:"hp_current"`
		HitDice          string `yaml:"hit_dice" json:"hit_dice"`
		PassivePerception int   `yaml:"passive_perception" json:"passive_perception"`
		Inspiration      int    `yaml:"inspiration" json:"inspiration"`
	} `yaml:"vitals" json:"vitals"`
	Skills         map[string]Skill       `yaml:"-" json:"skills"`
	RawSkills      map[string]interface{} `yaml:"skills" json:"-"`
	FeaturesTraits []Feature              `yaml:"features_traits" json:"features_traits"`
	Attacks        []struct {
		Name     string `yaml:"name" json:"name"`
		AtkBonus int    `yaml:"atk_bonus" json:"atk_bonus"`
		Damage   string `yaml:"damage" json:"damage"`
	} `yaml:"attacks" json:"attacks"`
	ProficienciesLanguages struct {
		Languages     []string `yaml:"languages" json:"languages"`
		Proficiencies []string `yaml:"proficiencies" json:"proficiencies"`
	} `yaml:"proficiencies_languages" json:"proficiencies_languages"`
	Equipment struct {
		Items []string `yaml:"items" json:"items"`
	} `yaml:"equipment" json:"equipment"`
	Personality struct {
		Traits string `yaml:"traits" json:"traits"`
		Ideals string `yaml:"ideals" json:"ideals"`
		Bonds  string `yaml:"bonds" json:"bonds"`
		Flaws  string `yaml:"flaws" json:"flaws"`
	} `yaml:"personality" json:"personality"`
	Spellcasting struct {
		Ability     string `yaml:"ability" json:"ability"`
		SaveDC      int    `yaml:"save_dc" json:"save_dc"`
		AttackBonus int    `yaml:"attack_bonus" json:"attack_bonus"`
		Spells      struct {
			Cantrips []DetailedSpell `yaml:"cantrips" json:"cantrips"`
			Level1   []DetailedSpell `yaml:"level_1" json:"level_1"`
			Level2   []DetailedSpell `yaml:"level_2" json:"level_2"`
		} `yaml:"spells" json:"spells"`
	} `yaml:"spellcasting" json:"spellcasting"`
}

type DetailedSpell struct {
	Name        string `yaml:"name" json:"name"`
	Desc        string `yaml:"description" json:"description"`
	Range       string `yaml:"range" json:"range"`
	Duration    string `yaml:"duration" json:"duration"`
	Components  string `yaml:"components" json:"components"`
	AttackSave  string `yaml:"attack_save" json:"attack_save"`
	School      string `yaml:"school" json:"school"`
}

type CharacterDB struct {
	ID   string    `json:"id,omitempty"`
	Name string    `json:"name"`
	Data Character `json:"data"`
}

const sessionCookieName = "lazarus_session"
const sessionSecret = "croky"

var (
	sessions = make(map[string]bool)
	sbClient *supabase.Client
)

func main() {
	// Initialize Supabase
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_KEY")
	if supabaseURL != "" && supabaseKey != "" {
		sbClient = supabase.CreateClient(supabaseURL, supabaseKey)
		fmt.Println("Connected to Supabase.")
		
		// Run simple migration
		migrateToSupabase("reference/lazarus_sheet.yaml")
	}

	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			if r.FormValue("password") == sessionSecret {
				sessionID := "active_session"
				sessions[sessionID] = true
				http.SetCookie(w, &http.Cookie{
					Name: sessionCookieName, Value: sessionID, Path: "/", HttpOnly: true, SameSite: http.SameSiteStrictMode,
				})
				w.Header().Set("HX-Redirect", "/")
				w.WriteHeader(http.StatusOK)
				return
			}
			w.Header().Set("Content-Type", "text/html")
			fmt.Fprint(w, `<p class="error-msg">Invalid codeword.</p>`)
			return
		}
		tmpl := template.Must(template.ParseFiles("templates/login.html"))
		tmpl.Execute(w, nil)
	})

	http.HandleFunc("/logout", func(w http.ResponseWriter, r *http.Request) {
		http.SetCookie(w, &http.Cookie{Name: sessionCookieName, Value: "", Path: "/", HttpOnly: true, MaxAge: -1})
		http.Redirect(w, r, "/login", http.StatusSeeOther)
	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if !isAuthenticated(r) {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}

		var char *Character
		var err error
		
		if sbClient != nil {
			char, err = loadCharacterFromSupabase("Lazarus")
		}
		
		if char == nil {
			char, err = loadCharacterFromYAML("reference/lazarus_sheet.yaml")
		}

		if err != nil {
			http.Error(w, "Failed to load character", http.StatusInternalServerError)
			return
		}

		tmpl := template.Must(template.ParseFiles("templates/index.html"))
		tmpl.Execute(w, char)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Server starting on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func isAuthenticated(r *http.Request) bool {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		return false
	}
	return sessions[cookie.Value]
}

func migrateToSupabase(path string) error {
	fmt.Println("Migrating Lazarus to Supabase...")
	char, err := loadCharacterFromYAML(path)
	if err != nil {
		return err
	}

	// We'll use a simple upsert logic: delete if exists, then insert.
	// In a real app we'd use .Upsert() but the current library wrapper might be simpler.
	var results []CharacterDB
	sbClient.DB.From("characters").Delete().Eq("name", "Lazarus").Execute(&results)

	var insertRow []CharacterDB
	err = sbClient.DB.From("characters").Insert(CharacterDB{
		Name: "Lazarus",
		Data: *char,
	}).Execute(&insertRow)
	
	return err
}

func loadCharacterFromSupabase(name string) (*Character, error) {
	var results []CharacterDB
	err := sbClient.DB.From("characters").Select("*").Eq("name", name).Execute(&results)
	if err != nil || len(results) == 0 {
		return nil, fmt.Errorf("not found")
	}
	return &results[0].Data, nil
}

func loadCharacterFromYAML(path string) (*Character, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var char struct {
		Character Character `yaml:"character"`
	}
	err = yaml.Unmarshal(data, &char)
	if err != nil {
		return nil, err
	}

	char.Character.Skills = make(map[string]Skill)
	for k, v := range char.Character.RawSkills {
		if m, ok := v.(map[string]interface{}); ok {
			var s Skill
			if mod, ok := m["mod"].(int); ok {
				s.Mod = mod
			}
			if prof, ok := m["prof"].(bool); ok {
				s.Prof = prof
			}
			if exp, ok := m["expertise"].(bool); ok {
				s.Expertise = exp
			}
			char.Character.Skills[k] = s
		} else if k == "passive_perception" {
			if pp, ok := v.(int); ok {
				char.Character.Vitals.PassivePerception = pp
			}
		}
	}

	return &char.Character, nil
}
