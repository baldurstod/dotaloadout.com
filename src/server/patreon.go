package main

import (
	"encoding/gob"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/baldurstod/patreon-go"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
)

var _ = registerToken()

func registerToken() bool {
	gob.Register(oauth2.Token{})
	//gob.Register(resources.User{})
	//gob.Register(resources.Member{})
	gob.Register(time.Time{})
	return true
}

const PATREON_AUTHORIZE_URL = "https://www.patreon.com/oauth2/authorize"

type patreonMiddleware struct {
	clientID     string
	clientSecret string
	redirectURL  string
	creatorID    string
	config       *patreon.PatreonConfig
}

func newPatreonMiddleware(clientID string, clientSecret string, redirectURL string, creatorID string) *patreonMiddleware {
	return &patreonMiddleware{
		clientID:     clientID,
		clientSecret: clientSecret,
		redirectURL:  redirectURL,
		creatorID:    creatorID,
		config: patreon.NewPatreonConfig(
			clientID,
			clientSecret,
			redirectURL,
			[]string{"identity", "campaigns", "campaigns.members"},
		),
	}
}

// Middleware function, which will be called for each request
func (pm *patreonMiddleware) middleware(r *gin.Engine) gin.HandlerFunc {
	return func(c *gin.Context) {
		switch c.Request.URL.Path {
		case "/":
			pm.checkPatreon(c)
			c.Next()
		case "/patreon/login":
			pm.loginPatreon(c)
		case "/patreon/redirect":
			pm.redirectPatreon(c)
		case "/patreon/logout":
			pm.logoutPatreon(c)
		case "/patreon/whoami":
			pm.whoAmI(c)
		case "/js/application.js":
			session := getSession(c)

			if currentlyEntitledAmountCents := session.Get("currently_entitled_amount_cents"); currentlyEntitledAmountCents != nil {
				if currentlyEntitledAmountCents.(int) >= 100 {
					if currentlyEntitledAmountCents.(int) >= 300 {
						c.Request.URL.Path = "/js/application_poweruser.js"
					} else {
						c.Request.URL.Path = "/js/application_supporter.js"
					}
					r.HandleContext(c)
				}
			}
			c.Next()
		default:

			c.Next()
		}
	}
}

func (pm *patreonMiddleware) checkPatreon(c *gin.Context) {
	session := getSession(c)
	if expiry := session.Get("patreon_expiry"); expiry == nil || time.Now().After(expiry.(time.Time)) {
		patreonClient := patreon.NewPatreonClient(pm.config)
		session := getSession(c)
		token := session.Get("patreon_token")
		session.Set("currently_entitled_amount_cents", 0)

		if token != nil {
			if t, ok := token.(oauth2.Token); ok {
				patreonClient.SetToken(&t)
				pm.refreshCredentials(patreonClient, session)
			}
		}

		err := saveSession(session)
		if err != nil {
			log.Println("Error while saving session: ", err)
		}
	}
}

func (pm *patreonMiddleware) loginPatreon(c *gin.Context) {

	// Redirects to the patreon authorize page

	params := url.Values{
		"response_type": {"code"},
		//"scope": {"identity"},
		"client_id":    {pm.clientID},
		"redirect_uri": {pm.redirectURL},
	}

	u, _ := url.Parse(PATREON_AUTHORIZE_URL)
	u.RawQuery = params.Encode()
	c.Redirect(http.StatusSeeOther, u.String())
}

func (pm *patreonMiddleware) redirectPatreon(c *gin.Context) {
	// We always redirect to root
	defer c.Redirect(http.StatusSeeOther, "/")
	session := getSession(c)

	session.Set("patreon_logged", false)

	// Retrieve the authorization code
	values := c.Request.URL.Query()
	code := values.Get("code")
	if code == "" {
		return
	}

	patreonClient := patreon.NewPatreonClient(pm.config)
	err := patreonClient.Exchange(code)
	if err != nil {
		log.Println(err)
		return
	}

	pm.refreshCredentials(patreonClient, session)

	err = saveSession(session)
	if err != nil {
		log.Println("Error while saving session: ", err)
	}
}

func (pm *patreonMiddleware) refreshCredentials(patreonClient *patreon.PatreonClient, session sessions.Session) {
	user, member, err := patreonClient.GetMembership()
	if err != nil {
		log.Println(err)
		return
	}

	currentlyEntitledAmountCents := 0
	if member != nil {
		currentlyEntitledAmountCents = member.Attributes.CurrentlyEntitledAmountCents
	}
	if user.ID == pm.creatorID {
		currentlyEntitledAmountCents = 10000
	}

	session.Set("patreon_logged", true)
	session.Set("patreon_token", *patreonClient.GetToken())
	session.Set("patreon_user_id", user.ID)
	session.Set("patreon_user_fullname", user.Attributes.FullName)
	session.Set("currently_entitled_amount_cents", currentlyEntitledAmountCents)
	session.Set("patreon_expiry", time.Now().Add(1*time.Minute))
}

func (pm *patreonMiddleware) logoutPatreon(c *gin.Context) {
	session := getSession(c)
	session.Delete("patreon_logged")
	session.Delete("patreon_token")
	session.Delete("patreon_user_id")
	session.Delete("patreon_user_fullname")
	session.Delete("currently_entitled_amount_cents")
	session.Delete("patreon_expiry")
	err := saveSession(session)
	if err != nil {
		log.Println("Error while saving session: ", err)
	}

	c.Redirect(http.StatusSeeOther, "/")
}

func (pm *patreonMiddleware) whoAmI(c *gin.Context) {
	session := getSession(c)

	logged := session.Get("patreon_logged")
	userID := session.Get("patreon_user_id")
	fullName := session.Get("patreon_user_fullname")
	currently_entitled_amount_cents := session.Get("currently_entitled_amount_cents")

	fmt.Fprintln(c.Writer, "Logged:", logged)
	fmt.Fprintln(c.Writer, "User id:", userID)
	fmt.Fprintln(c.Writer, "Full name:", fullName)
	fmt.Fprintln(c.Writer, "Pledge:", currently_entitled_amount_cents)
}
