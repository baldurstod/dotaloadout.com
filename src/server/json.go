package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func jsonSuccess(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"result":  data,
	})
}
