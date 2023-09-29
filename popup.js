// Snag our button
let btn = document.getElementById("compute")

import guessList from "./wordle-master-alphabetical.json" assert { type: "json" }

// Run on click
btn.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true}) // Find current tab

    

    if (tab.url !== "https://www.nytimes.com/games/wordle/index.html") return

    let grid = [
        [{letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}],
        [{letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}],
        [{letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}],
        [{letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}],
        [{letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}],
        [{letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}]
    ];

    chrome.scripting.executeScript({ // Run the following script on our tab
        target: {tabId: tab.id},
        function: (grid, guessList) => {
            function allOccurencesOfPresentOrCorrect(arr) {
                let num = 0
                arr.forEach((val) => {
                    if (val === "correct" || val === "present") {
                        num += 1
                    }
                })
                return num
            }

            function allOccurencesOfLetter(letter, str) {
                let num = 0;
                Array.from(str).forEach((val) => {
                    if (val === letter) {
                        num += 1
                    }
                })
                return num
            }
            
            const elems = document.querySelectorAll(".Board-module_board__jeoPS > *")
            const container = document.querySelector(".suggestionsContainer") ? document.querySelector(".suggestionsContainer") : document.createElement("ol")
            container.className = "suggestionsContainer"
            container.style.display = "flex"
            container.style.flexDirection = "column"
            container.style.gap = "10px"
            container.style.color = "white"
            container.style.margin = "1.5rem"
            container.style.fontWeight = "600"
            if (!document.querySelector(".suggestionsContainer")) {
                document.querySelector(".Board-module_boardContainer__TBHNL").appendChild(container)
                const header = document.createElement("p")
                header.innerHTML = "10 Next Best Guesses"
                container.appendChild(header)
                for (let i = 0; i < 10; i++) {
                    const listItem = document.createElement("li")
                    listItem.className = `listItem${i+1}`
                    listItem.style.listStyle = "decimal"
                    container.appendChild(listItem)
                }
            }

            // store grid data
            for (let i = 0; i < elems.length; i++){ 
                const letters = elems[i].querySelectorAll(".Tile-module_tile__UWEHN")
                for (let j = 0; j < letters.length; j++) {
                    grid[i][j].letter = letters[j].innerHTML
                    grid[i][j].state = letters[j].dataset.state

                }
            }

            // eliminate impossible answers
            updatedGuessList = guessList.filter((value) => {
                for (let a = 0; a < grid.length; a++) {
                    if (grid[a][0].state === "empty" || grid[a][0].state === "tbd"){
                        continue
                    }

                    // need some sort of way to check for duplicate letters showing true and incorporate into absents
                    let seen = {}

                    // green and partial yellow pass
                    for (let b = 0; b < grid[a].length; b++) {
                        if (
                            ( grid[a][b].state === "correct" && grid[a][b].letter !== value.slice(b, b+1) ) ||
                            ( grid[a][b].state === "present" && grid[a][b].letter === value.slice(b, b+1) ) ||
                            ( grid[a][b].state === "present" && !value.includes(grid[a][b].letter) )
                        ) {
                            return false
                        }
                        if (grid[a][b].letter in seen) {
                            seen[grid[a][b].letter].push(grid[a][b].state)
                        }
                        else {
                            seen[grid[a][b].letter] = [grid[a][b].state]
                        }
                    }

                    // misc pass
                    for (let b = 0; b < grid[a].length; b++) {
                        if (grid[a][b].state === "absent") {
                            if ( allOccurencesOfPresentOrCorrect(seen[grid[a][b].letter]) === 0 && value.includes(grid[a][b].letter) ) {
                                return false
                            }
                            if ( allOccurencesOfPresentOrCorrect(seen[grid[a][b].letter]) !== allOccurencesOfLetter(grid[a][b].letter, value) ) {
                                return false
                            }
                        }
                        if (grid[a][b].state === "present" || grid[a][b].state == "correct") {
                            if ( allOccurencesOfPresentOrCorrect(seen[grid[a][b].letter]) > allOccurencesOfLetter(grid[a][b].letter, value)) {
                                return false
                            }
                        }
                    }

                    // console.log(`${Object.keys(seen)} ${Object.values(seen)}`)

                }
                return true
            })
            // console.log(updatedGuessList)
            
            
            // compute all matches for all color combinations for all remaining words
            let results = []
            const colors = ["correct", "present", "absent"]

            // go through each possible next guess
            for (let eachWord of updatedGuessList) {
                
                // all matches of this word and corresponding color combos
                let matches = {}

                // go through each color combination of the word
                for (let color1 of colors) {
                    for (let color2 of colors) {
                        for (let color3 of colors) {
                            for (let color4 of colors) {
                                for (let color5 of colors) {
                                    // better representation of our word, split into letters and corresponding states
                                    word = [{letter: eachWord[0], state: color1}, {letter: eachWord[1], state: color2}, {letter: eachWord[2], state: color3}, {letter: eachWord[3], state: color4}, {letter: eachWord[4], state: color5}]

                                    // check against every other word
                                    for (let checkWord of updatedGuessList) {
                                        let isAMatch = true

                                        // need some sort of way to check for duplicate letters showing true and incorporate into absents
                                        let seen = {}

                                        // green and partial yellow pass
                                        for (let b = 0; b < word.length; b++) {
                                            if (
                                                ( word[b].state === "correct" && word[b].letter !== checkWord.slice(b, b+1) ) ||
                                                ( word[b].state === "present" && word[b].letter === checkWord.slice(b, b+1) ) ||
                                                ( word[b].state === "present" && !checkWord.includes(word[b].letter) )
                                            ) {
                                                isAMatch = false
                                                break
                                            }
                                            if (word[b].letter in seen) {
                                                seen[word[b].letter].push(word[b].state)
                                            }
                                            else {
                                                seen[word[b].letter] = [word[b].state]
                                            }
                                        }

                                        if(!isAMatch) {
                                            continue
                                        }

                                        // misc pass
                                        for (let b = 0; b < word.length; b++) {
                                            if (word[b].state === "absent") {
                                                if ( allOccurencesOfPresentOrCorrect(seen[word[b].letter]) === 0 && checkWord.includes(word[b].letter) ) {
                                                    isAMatch = false
                                                    break
                                                }
                                                if ( allOccurencesOfPresentOrCorrect(seen[word[b].letter]) !== allOccurencesOfLetter(word[b].letter, checkWord) ) {
                                                    isAMatch = false
                                                    break
                                                }
                                            }
                                            if (word[b].state === "present" || word[b].state == "correct") {
                                                if ( allOccurencesOfPresentOrCorrect(seen[word[b].letter]) > allOccurencesOfLetter(word[b].letter, checkWord)) {
                                                    isAMatch = false
                                                    break
                                                }
                                            }
                                        }

                                        if (isAMatch) {
                                            // console.log(`${color1} ${color2} ${color3} ${color4} ${color5}`)
                                            if (`${color1} ${color2} ${color3} ${color4} ${color5}` in matches) matches[`${color1} ${color2} ${color3} ${color4} ${color5}`].push(checkWord)
                                            else matches[`${color1} ${color2} ${color3} ${color4} ${color5}`] = [checkWord]
                                        }
                                    }
                                    // matches[`${color1} ${color2} ${color3} ${color4} ${color5}`] = word
                                }
                            }
                        }
                    }
                }
                
                
                // calculate the bits of each choice
                let sum = 0
                Object.keys(matches).forEach((val) => {
                    probabilityOfOption = matches[val].length / updatedGuessList.length
                    sum += probabilityOfOption * Math.log2(1/probabilityOfOption)
                })
                
                results.push([eachWord, sum])

            }

            // sort results
            results.sort((a, b) => {
                return b[1]-a[1]
            })

            for (let i = 0; i < 10; i++) {
                document.querySelector(`.listItem${i+1}`).innerHTML = i < results.length ? `${results[i][0]} ${Math.round(results[i][1]*10000)/10000}` : ""
            }
        },
        args: [grid, guessList.guesses]
    })

})
