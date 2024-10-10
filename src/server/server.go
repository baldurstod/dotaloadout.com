package main

import (
	"io/fs"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	assets "github.com/baldurstod/dotaloadout.com"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func startServer(config HTTP) {
	engine := initEngine()
	var err error

	log.Printf("Listening on port %d\n", config.Port)
	if config.Https || (ReleaseMode == "true") { // HTTPS is mandatory in release mode
		err = engine.RunTLS(":"+strconv.Itoa(config.Port), config.HttpsCertFile, config.HttpsKeyFile)
	} else {
		err = engine.Run(":" + strconv.Itoa(config.Port))
	}
	log.Fatal(err)
}

func initEngine() *gin.Engine {
	if ReleaseMode == "true" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()
	r.SetTrustedProxies(nil)

	r.Use(cors.New(cors.Config{
		AllowMethods:    []string{"POST", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Length", "Content-Type", "Request-Id"},
		AllowAllOrigins: true,
		MaxAge:          12 * time.Hour,
	}))

	var useFS fs.FS
	var assetsFs = &assets.Assets

	if ReleaseMode == "true" {
		fsys := fs.FS(assetsFs)
		useFS, _ = fs.Sub(fsys, "build/client")
	} else {
		useFS = os.DirFS("build/client")
	}

	r.Use(rewriteURL(r))
	r.StaticFS("/static", http.FS(useFS))

	return r
}

func rewriteURL(r *gin.Engine) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.URL.Path == "/list" {
			c.Next()
			return
		}
		if strings.HasPrefix(c.Request.URL.Path, "/@") {
			c.Request.URL.Path = "/"
			r.HandleContext(c)
			c.Next()
			return
		}
		if !strings.HasPrefix(c.Request.URL.Path, "/static") {
			c.Request.URL.Path = "/static" + c.Request.URL.Path
			r.HandleContext(c)
			c.Next()
			return
		}
		c.Next()
	}
}
