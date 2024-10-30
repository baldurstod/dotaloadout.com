package main

import (
	"log"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

/*
var store *sessions.FilesystemStore

func initStore(config *Sessions) *sessions.FilesystemStore {
	authKey, err := base64.StdEncoding.DecodeString(config.SessionsAuthKey)
	if err != nil {
		log.Println("error:", err)
		return nil
	}

	encryptKey, err := base64.StdEncoding.DecodeString(config.SessionsEncryptKey)
	if err != nil {
		log.Println("error:", err)
		return nil
	}

	store := sessions.NewFilesystemStore(config.SessionsFileStore, authKey, encryptKey)
	store.MaxLength(50000)
	return store
}*/

func getSession(c *gin.Context) sessions.Session {
	session := sessions.Default(c)
	session.Options(sessions.Options{MaxAge: 86400 * 30, Path: "/"})
	return session
}

func saveSession(s sessions.Session) error {
	err := s.Save()
	if err != nil {
		log.Println("Error while saving session: ", err)
	}
	return nil
}
