package rng

import (
	"math/rand"
)

// RNG is the interface for random number generation, allowing dependency injection for testing.
type RNG interface {
	Intn(n int) int
	Seed(seed int64)
}

type DefaultRNG struct {
	rng *rand.Rand
}

func NewSeededRNG(seed int64) *DefaultRNG {
	return &DefaultRNG{rng: rand.New(rand.NewSource(seed))}
}

func (d *DefaultRNG) Intn(n int) int {
	return d.rng.Intn(n)
}

func (d *DefaultRNG) Seed(seed int64) {
	d.rng.Seed(seed)
}

func RollD20(rng RNG) int {
	return rng.Intn(20) + 1
}

func RollDie(rng RNG, sides int) int {
	return rng.Intn(sides) + 1
}

type DiceRollResult struct {
	Rolls    []int `json:"rolls"`
	Total    int   `json:"total"`
	Modifier int   `json:"modifier,omitempty"`
}

func RollDice(rng RNG, count, sides, modifier int) DiceRollResult {
	rolls := make([]int, count)
	total := 0
	for i := 0; i < count; i++ {
		rolls[i] = RollDie(rng, sides)
		total += rolls[i]
	}
	total += modifier
	return DiceRollResult{Rolls: rolls, Total: total, Modifier: modifier}
}