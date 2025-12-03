/**
 * Sound effects utility
 * TODO: Replace with custom sounds from user's choice
 */

let correctSound: HTMLAudioElement | null = null
let wrongSound: HTMLAudioElement | null = null

if (typeof window !== 'undefined') {
  // Create audio elements - will be populated when sounds are chosen
  correctSound = new Audio()
  wrongSound = new Audio()
  
  // Placeholder: Add your sound file paths here
  // correctSound.src = '/sounds/correct.mp3'
  // wrongSound.src = '/sounds/wrong.mp3'
  
  correctSound.volume = 0.4
  wrongSound.volume = 0.4
}

export function playCorrectSound() {
  if (correctSound && correctSound.src) {
    correctSound.currentTime = 0
    correctSound.play().catch(() => {
      // Ignore autoplay errors
    })
  }
}

export function playWrongSound() {
  if (wrongSound && wrongSound.src) {
    wrongSound.currentTime = 0
    wrongSound.play().catch(() => {
      // Ignore autoplay errors
    })
  }
}
