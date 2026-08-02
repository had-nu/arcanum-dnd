package rng

import (
	"math/rand"
)

type DefaultRNG struct {
	rng *rand.Rand
}

func NewSeededRNG(seed int64) *DefaultRNG {
	return &DefaultRNG{rng: rand.New(rand.NewSource(seed))}
}

func (d *DefaultRNG) Intn(n int) int {
	return d.rng.Intn(n)
}

func RollD20(rng *DefaultRNG) int {
	return rng.Intn(20) + 1
}

func RollDie(rng *DefaultRNG, sides int) int {
	return rng.Intn(sides) + 1
}

type DiceRollResult struct {
	Rolls    []int `json:"rolls"`
	Total    int   `json:"total"`
	Modifier int   `json:"modifier,omitempty"`
}

func RollDice(rng *DefaultRNG, count, sides, modifier int) DiceRollResult {
	rolls := make([]int, count)
	total := 0
	for i := 0; i < count; i++ {
		rolls[i] = RollDie(rng, sides)
		total += rolls[i]
	}
	total += modifier
	return DiceRollResult{Rolls: rolls, Total: total, Modifier: modifier}
}
