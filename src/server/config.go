package main

type Config struct {
	HTTP     `json:"http"`
	Patreon  `json:"patreon"`
	Sessions `json:"sessions"`
}

type HTTP struct {
	Port          int    `json:"port"`
	HttpsKeyFile  string `json:"https_key_file"`
	HttpsCertFile string `json:"https_cert_file"`
}

type Patreon struct {
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
	RedirectURL  string `json:"redirect_url"`
	CreatorID    string `json:"creator_id"`
}

type Sessions struct {
	SessionsFileStore  string `json:"sessions_file_store"`
	SessionsAuthKey    string `json:"sessions_auth_key"`
	SessionsEncryptKey string `json:"sessions_encrypt_key"`
}
