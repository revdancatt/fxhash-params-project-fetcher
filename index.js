/*
  THIS IS A VERY HORRID WAY OF DOING THIS, BUT ICBA TO MAKE IT BETTER
  This script will fetch all the objkts for a given project id and write them to a file
  To run this script you need to have node installed
  You can then run the script by running the following command in the terminal
  node index.js <project id>
  e.g. node index.js 1
  This will create a file called 1.json in the data folder
  The file will contain all the objkts for the project
*/
const path = require('path')
const fs = require('fs')
let fetch

// The first thing we need to do is make sure we've been passed in a project id on the command line
const projectId = process.argv[2]
if (!projectId) {
  console.error('Please provide a project id as the first argument')
  process.exit(1)
}

// We are going to be hitting the graphQL API end point, we don't need a key but this is the query we are going to be sending
let skip = 0

// Now we need something to hold the data we are going to be getting back
const objkts = []

const main = async () => {
  const { default: nodeFetch } = await import('node-fetch')
  fetch = nodeFetch

  console.log('Fetching skip: ', skip)
  const query = `
  query {
    generativeToken(id:${projectId}) {
      name
      objktsCount
      objkts(take: 50, skip: ${skip}) {
        id
        name
        generationHash
        inputBytes
      }
    }
  }`
  // When we make the first call we'll get back a count of how many objkts there are, we can use this to work out how many times we need to call the API
  const firstCall = await fetch('https://api.fxhash.xyz/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })
  const firstResponse = await firstCall.json()
  const objktsCount = firstResponse.data.generativeToken.objktsCount
  const theseObjkts = firstResponse.data.generativeToken.objkts
  objkts.push(...theseObjkts)
  // Update the skip value so we get the next 50 objkts
  skip += 50
  // Check if we have all the objkts
  if (objkts.length < objktsCount) {
    // If not, call the API again
    await main()
  }
  // If we have all the objkts, write them to a file
  if (objkts.length >= objktsCount) {
    // Check to see if we have a folder called data, if not create it
    const dataFolder = path.join(__dirname, 'data')
    if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder)
    // Write the data to a file
    fs.writeFileSync(path.join(dataFolder, `${projectId}.json`), JSON.stringify(objkts, null, 2), 'utf8')
    // Let the user know we are done
    console.log('Done')
  }
}

main()
