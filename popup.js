import guessListRaw from "./wordle-master-alphabetical.json" assert { type: "json" }
import freqListRaw from "./wordle-frequencies.json" assert { type : "json" }
const guessList = guessListRaw.guesses

let btn = document.getElementById("compute")

chrome.runtime.onMessage.addListener((grid) => {
    if (document.querySelector(".wrapper")) {
        document.body.removeChild(document.querySelector(".wrapper"))
    }

    function sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    function linspace(start, stop, num) {
        const step = (stop - start) / (num - 1);
        return Array.from({length: num}, (_, i) => start + step * i);
    }

    const zip = (a, b) => a.map((e, i) => [e, b[i]])

    let freqList = Object.keys(freqListRaw).sort((a, b) => freqListRaw[a] - freqListRaw[b])
    let x_width = 10
    let c = x_width * (-0.5 + 4000 / Object.keys(freqList).length)
    let xs = linspace(c - x_width / 2, c + x_width / 2, Object.keys(freqList).length)
    let datafiedFreqs = {}
    zip(freqList, xs).forEach((tuple) => {datafiedFreqs[tuple[0]] = sigmoid(tuple[1])})
    
    
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

    const wrapper = document.createElement("div")
    wrapper.className = "wrapper"
    wrapper.style.width = "100%"
    wrapper.style.display = "flex"
    wrapper.style.justifyContent = "space-evenly"
    wrapper.style.color = "black"
    wrapper.style.fontWeight = "600"
    
    const container = document.createElement("div")
    container.className = "suggestionsContainer"
    container.style.display = "flex"
    container.style.flexDirection = "column"
    container.style.gap = "10px"

    const containerMain = document.createElement("div")
    containerMain.className = "suggestionsMain"
    containerMain.style.display = "flex"

    const containerWords = document.createElement("div")
    containerWords.className = "containerWords"
    containerWords.style.display = "flex"
    containerWords.style.flexDirection = "column"
    containerWords.style.gap = "10px"
    containerWords.style.width = "100%"

    const containerBits = document.createElement("div")
    containerBits.className = "containerBits"
    containerBits.style.display = "flex"
    containerBits.style.flexDirection = "column"
    containerBits.style.gap = "10px"
    containerBits.style.width = "100%"

    const possibilities = document.createElement("div")
    possibilities.className = "possibilities"
    possibilities.style.display = "flex"
    possibilities.style.flexDirection = "column"
    possibilities.style.gap = "10px"

    const possibilitiesMain = document.createElement("div")
    possibilitiesMain.className = "possibilitiesMain"
    possibilitiesMain.style.display = "flex"

    const possibilitiesWords = document.createElement("div")
    possibilitiesWords.className = "possibilitiesWords"
    possibilitiesWords.style.display = "flex"
    possibilitiesWords.style.flexDirection = "column"
    possibilitiesWords.style.gap = "10px"
    possibilitiesWords.style.width = "100%"

    const possibilitiesProbs = document.createElement("div")
    possibilitiesProbs.className = "possibilitiesProbs"
    possibilitiesProbs.style.display = "flex"
    possibilitiesProbs.style.flexDirection = "column"
    possibilitiesProbs.style.gap = "10px"
    possibilitiesProbs.style.width = "100%"
    
    const header = document.createElement("h2")
    header.className = "suggestionsHeader"
    header.style.textAlign = 'center'

    const possHeader = document.createElement("h2")
    possHeader.className = "possibilitiesHeader"
    possHeader.style.textAlign = 'center'

    const divider = document.createElement("div")
    divider.style.width = "1px"
    divider.style.backgroundColor = "black"


    container.appendChild(header)
    container.appendChild(containerMain)
    containerMain.appendChild(containerWords)
    containerMain.appendChild(containerBits)
    possibilities.appendChild(possHeader)
    possibilities.appendChild(possibilitiesMain)
    possibilitiesMain.appendChild(possibilitiesWords)
    possibilitiesMain.appendChild(possibilitiesProbs)
    document.body.appendChild(wrapper)
    wrapper.appendChild(container)
    wrapper.appendChild(divider)
    wrapper.appendChild(possibilities)
    
    
    
    // eliminate impossible answers
    const updatedGuessList = guessList.filter((value) => {
        for (let a = 0; a < grid.length; a++) {
            if (grid[a][0].state === "empty" || grid[a][0].state === "tbd"){
                if (a == 0) {
                    wrapper.innerHTML = "Please input a first guess first!"
                    return;
                }
                continue
            }

            // need some sort of way to check for duplicate letters showing true and incorporate into absents
            let seen = {}

            // green and partial yellow pass
            for (let b = 0; b < grid[a].length; b++) {
                if (
                    ( grid[a][b].state === "correct" && grid[a][b].letter !== value.slice(b, b+1) ) ||
                    ( (grid[a][b].state === "present" || grid[a][b].state === "absent") && grid[a][b].letter === value.slice(b, b+1) ) ||
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

    // go through each possible next guess
    for (let eachWord of guessList) {
        
        // all matches of this word and corresponding color combos
        let matches = {}

        // check against every possible answer
        for (let checkWord of updatedGuessList) {
            let tempWord = checkWord.toUpperCase()
            let tempLetters = eachWord.toUpperCase()
            let tempColors = ["", "", "", "", ""]

            for (let i = 0; i < tempLetters.length; i++) {
                if (tempLetters.charAt(i) === tempWord.charAt(i)) {
                    tempColors[i] = "correct"
                    tempWord = tempWord.slice(0, i) + tempWord.charAt(i).toLowerCase() + tempWord.slice(i+1)
                    tempLetters = tempLetters.slice(0, i) + tempLetters.charAt(i).toLowerCase() + tempLetters.slice(i+1)
                }
            }
            
            for (let i = 0; i < tempLetters.length; i++) {
                if (tempColors[i] !== "correct") {
                    if (tempWord.includes(tempLetters.charAt(i))) {
                        tempColors[i] = "present"
                        tempWord = tempWord.slice(0, tempWord.indexOf(tempLetters[i])) + tempWord.charAt(tempWord.indexOf(tempLetters[i])).toLowerCase() + tempWord.slice(tempWord.indexOf(tempLetters[i])+1)
                        tempLetters = tempLetters.slice(0, i) + tempLetters.charAt(i).toLowerCase() + tempLetters.slice(i+1)
                    }
                    else {
                        tempColors[i] = "absent"
                    }
                }
            }
            // console.log(`${color1} ${color2} ${color3} ${color4} ${color5}`)
            if (`${tempColors[0]} ${tempColors[1]} ${tempColors[2]} ${tempColors[3]} ${tempColors[4]}` in matches) matches[`${tempColors[0]} ${tempColors[1]} ${tempColors[2]} ${tempColors[3]} ${tempColors[4]}`].push(checkWord)
            else matches[`${tempColors[0]} ${tempColors[1]} ${tempColors[2]} ${tempColors[3]} ${tempColors[4]}`] = [checkWord]
            
        }
        // matches[`${color1} ${color2} ${color3} ${color4} ${color5}`] = word
                        
        
        
        // calculate the bits of each choice
        let sum = 0
        Object.keys(matches).forEach((val) => {
            const probabilityOfOption = matches[val].length / updatedGuessList.length
            sum += probabilityOfOption * Math.log2(1/probabilityOfOption)
        })
        
        // add to the results array
        if (sum != 0) {
            results.push([eachWord, sum])
            console.log(eachWord)
            console.log(matches)
            console.log(" ")
        }

    }

    // sort results
    results.sort((a, b) => {
        return (b[1])-(a[1])
    })

    let possibilitiesList = []
    updatedGuessList.forEach((e) => possibilitiesList.push([e, datafiedFreqs[e]]))

    // sort possibilities list
    possibilitiesList.sort((a, b) => {
        return b[1] - a[1]
    })

    header.innerHTML = `Best Information Guesses (${results.length})`
    for (let i = 0; i < results.length; i++) {
        if (i == 0) {
            const wordsHeader = document.createElement("h3")
            wordsHeader.className = "suggestWordHead"
            wordsHeader.style.textAlign = 'center'
            wordsHeader.style.textDecoration = 'underline'
            wordsHeader.innerHTML = "Words:"
            const bitsHeader = document.createElement("h3")
            bitsHeader.className = "suggestBitsHead"
            bitsHeader.style.textAlign = 'center'
            bitsHeader.style.textDecoration = 'underline'
            bitsHeader.innerHTML = "Bits:"
            containerWords.appendChild(wordsHeader)
            containerBits.append(bitsHeader)
        }
        
        
        const listItem1 = document.createElement("p")
        const listItem2 = document.createElement("p")
        listItem1.style.textTransform = "uppercase"
        listItem1.style.fontSize = '15px'
        listItem1.style.textAlign = 'center'
        listItem2.style.textTransform = "uppercase"
        listItem2.style.fontSize = '15px'
        listItem2.style.textAlign = 'center'
        containerWords.appendChild(listItem1)
        containerBits.appendChild(listItem2)
        listItem1.innerHTML = `${results[i][0]}`
        listItem2.innerHTML = `${Math.round(results[i][1]*10000)/10000}`
    }

    possHeader.innerHTML = `Most Likely Answers (${possibilitiesList.length})`
    for (let i = 0; i < possibilitiesList.length; i++) {
        if (i == 0) {
            const wordsHeader = document.createElement("h3")
            wordsHeader.className = "answersWordHead"
            wordsHeader.style.textAlign = 'center'
            wordsHeader.style.textDecoration = 'underline'
            wordsHeader.innerHTML = "Words:"
            const probsHeader = document.createElement("h3")
            probsHeader.className = "answersProbsHead"
            probsHeader.style.textAlign = 'center'
            probsHeader.style.textDecoration = 'underline'
            probsHeader.innerHTML = "Frequencies:"
            possibilitiesWords.appendChild(wordsHeader)
            possibilitiesProbs.append(probsHeader)
        }
        
        
        const listItem1 = document.createElement("p")
        const listItem2 = document.createElement("p")
        listItem1.style.textTransform = "uppercase"
        listItem1.style.fontSize = '15px'
        listItem1.style.textAlign = 'center'
        listItem2.style.textTransform = "uppercase"
        listItem2.style.fontSize = '15px'
        listItem2.style.textAlign = 'center'
        possibilitiesWords.appendChild(listItem1)
        possibilitiesProbs.appendChild(listItem2)
        listItem1.innerHTML = `${possibilitiesList[i][0]}`
        listItem2.innerHTML = `${Math.round(possibilitiesList[i][1]*10000)/100}%`
    }
    
    divider.style.height = possibilities.getBoundingClientRect().height
})

// Run on click
btn.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true}) // Find current tab

    if (tab.url !== "https://www.nytimes.com/games/wordle/index.html" && tab.url !== "https://wordle-clone-navy.vercel.app/") return

    chrome.scripting.executeScript({ // Run the following script on our tab
        target: {tabId: tab.id},
        function: () => {
            
            const elems = document.querySelectorAll(".Board-module_board__jeoPS > *")

            let grid = [
                [{letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}],
                [{letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}],
                [{letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}],
                [{letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}],
                [{letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}],
                [{letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}, {letter: "", state: "empty"}]
            ];

            // store grid data
            for (let i = 0; i < elems.length; i++){ 
                const letters = elems[i].querySelectorAll(".Tile-module_tile__UWEHN")
                for (let j = 0; j < letters.length; j++) {
                    grid[i][j].letter = letters[j].innerHTML.toLowerCase()
                    grid[i][j].state = letters[j].dataset.state

                }
            }

            chrome.runtime.sendMessage(grid)

            
        }
    })

})
