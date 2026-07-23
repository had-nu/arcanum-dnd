package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const BaseURL = "https://apisearch.thedmstoolkit.com/api/2024"

type Client struct {
	httpClient *http.Client
	baseURL    string
	ticker     *time.Ticker
}

func NewClient() *Client {
	return &Client{
		httpClient: &http.Client{Timeout: 30 * time.Second},
		baseURL:    BaseURL,
		ticker:     time.NewTicker(time.Second),
	}
}

func (c *Client) Close() {
	c.ticker.Stop()
}

func (c *Client) fetchJSON(url string, target any) error {
	for attempt := range 3 {
		if attempt > 0 {
			time.Sleep(time.Duration(attempt*2) * time.Second)
		}
		<-c.ticker.C
		resp, err := c.httpClient.Get(url)
		if err != nil {
			return fmt.Errorf("GET %s: %w", url, err)
		}
		if resp.StatusCode == http.StatusTooManyRequests {
			resp.Body.Close()
			continue
		}
		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			return fmt.Errorf("read %s: %w", url, err)
		}
		if resp.StatusCode != http.StatusOK {
			return fmt.Errorf("GET %s: status %d: %s", url, resp.StatusCode, string(body))
		}
		if err := json.Unmarshal(body, target); err != nil {
			return fmt.Errorf("decode %s: %w", url, err)
		}
		return nil
	}
	return fmt.Errorf("GET %s: too many retries", url)
}

func (c *Client) ListClasses() ([]ResourceItem, error) {
	var resp struct {
		Data  []ResourceItem `json:"data"`
		Count int            `json:"count"`
	}
	if err := c.fetchJSON(c.baseURL+"/classes", &resp); err != nil {
		return nil, err
	}
	return resp.Data, nil
}

func (c *Client) GetClass(slug string) (*ClassData, error) {
	var resp struct {
		Data ClassData `json:"data"`
	}
	if err := c.fetchJSON(c.baseURL+"/classes/"+slug, &resp); err != nil {
		return nil, err
	}
	return &resp.Data, nil
}

func (c *Client) ListSpecies() ([]ResourceItem, error) {
	var resp struct {
		Data  []ResourceItem `json:"data"`
		Count int            `json:"count"`
	}
	if err := c.fetchJSON(c.baseURL+"/species", &resp); err != nil {
		return nil, err
	}
	return resp.Data, nil
}

func (c *Client) GetSpecies(slug string) (*SpeciesData, error) {
	var resp struct {
		Data SpeciesData `json:"data"`
	}
	if err := c.fetchJSON(c.baseURL+"/species/"+slug, &resp); err != nil {
		return nil, err
	}
	return &resp.Data, nil
}

func (c *Client) ListSpells() ([]ResourceItem, error) {
	var resp struct {
		Data  []ResourceItem `json:"data"`
		Count int            `json:"count"`
	}
	if err := c.fetchJSON(c.baseURL+"/spells", &resp); err != nil {
		return nil, err
	}
	return resp.Data, nil
}

func (c *Client) GetSpell(slug string) (*SpellData, error) {
	var resp struct {
		Data SpellData `json:"data"`
	}
	if err := c.fetchJSON(c.baseURL+"/spells/"+slug, &resp); err != nil {
		return nil, err
	}
	return &resp.Data, nil
}

func (c *Client) ListBackgrounds() ([]ResourceItem, error) {
	var resp struct {
		Data  []ResourceItem `json:"data"`
		Count int            `json:"count"`
	}
	if err := c.fetchJSON(c.baseURL+"/backgrounds", &resp); err != nil {
		return nil, err
	}
	return resp.Data, nil
}

func (c *Client) GetBackground(slug string) (*BackgroundData, error) {
	var resp struct {
		Data BackgroundData `json:"data"`
	}
	if err := c.fetchJSON(c.baseURL+"/backgrounds/"+slug, &resp); err != nil {
		return nil, err
	}
	return &resp.Data, nil
}

func (c *Client) ListFeats() ([]ResourceItem, error) {
	var resp struct {
		Data  []ResourceItem `json:"data"`
		Count int            `json:"count"`
	}
	if err := c.fetchJSON(c.baseURL+"/feats", &resp); err != nil {
		return nil, err
	}
	return resp.Data, nil
}

func (c *Client) GetFeat(slug string) (*FeatData, error) {
	var resp struct {
		Data FeatData `json:"data"`
	}
	if err := c.fetchJSON(c.baseURL+"/feats/"+slug, &resp); err != nil {
		return nil, err
	}
	return &resp.Data, nil
}

func (c *Client) ListItems() ([]ResourceItem, error) {
	var resp struct {
		Data  []ResourceItem `json:"data"`
		Count int            `json:"count"`
	}
	if err := c.fetchJSON(c.baseURL+"/items", &resp); err != nil {
		return nil, err
	}
	return resp.Data, nil
}

func (c *Client) GetItem(slug string) (*ItemData, error) {
	var resp struct {
		Data ItemData `json:"data"`
	}
	if err := c.fetchJSON(c.baseURL+"/items/"+slug, &resp); err != nil {
		return nil, err
	}
	return &resp.Data, nil
}

func (c *Client) ListMonsters() ([]ResourceItem, error) {
	var resp struct {
		Data  []ResourceItem `json:"data"`
		Count int            `json:"count"`
	}
	if err := c.fetchJSON(c.baseURL+"/monsters", &resp); err != nil {
		return nil, err
	}
	return resp.Data, nil
}

func (c *Client) GetMonster(slug string) (*MonsterData, error) {
	var resp struct {
		Data MonsterData `json:"data"`
	}
	if err := c.fetchJSON(c.baseURL+"/monsters/"+slug, &resp); err != nil {
		return nil, err
	}
	return &resp.Data, nil
}
