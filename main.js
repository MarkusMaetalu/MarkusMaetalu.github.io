document.getElementById("login-button").addEventListener("click", event=> logIn(document.getElementById("username&Email").value, document.getElementById("login-password").value))
document.getElementById("logout-button").addEventListener("click", event=> logOut())

const maxWidth = 500
const maxHeigth = 200

let firstTime
let lastTime
let isLoggedin = false
async function logIn(usernameEmail, password){
    try {
        const response = await fetch('https://01.kood.tech/api/auth/signin', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${btoa(`${usernameEmail}:${password}`)}`,
            },
        });
        if (response.ok) {
            const token = await response.json();
            localStorage.setItem('JWTtoken', token)
            isLoggedin=true
            document.getElementById("username&Email").value = ""
            document.getElementById("login-password").value = ""
            document.getElementById("logout-container").style.display = "flex"
            document.getElementById("login-container").style.display = "none"
            requestData()
        } else {
            const errorData = await response.json()
            alert(errorData.error)
        }
    } catch (error) {
        console.error('Login error:', error)
        alert('Server side error.')
    }
}

async function requestData() {
    const query = `
        query {
            user {
                id
                login
                attrs
                totalUp
                totalDown
                createdAt
                updatedAt
                transactions(order_by: { createdAt: asc }, where:{type: {_eq:"xp"}}){
                    type 
                    amount
                    createdAt
                    path
                }
            }
        }`

    fetch('https://01.kood.tech/api/graphql-engine/v1/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('JWTtoken')}`
        },
        body: JSON.stringify({ query }),
    }).then(resp => resp.json()
    ).then(QLdata => {
    const {firstName, lastName} = QLdata.data.user[0].attrs
    const id = QLdata.data.user[0].id
    const { totalDown, totalUp } = QLdata.data.user[0]
    const auditRatio = (totalUp/totalDown).toFixed(1)
    const transactions = QLdata.data.user[0].transactions

let XPsum = 0
let graphable = []
for(let val of transactions){
    if(val.path.startsWith("/johvi/piscine-go") ||  val.path.startsWith("/johvi/div-01/piscine-js")){
        continue
    }
    graphable.push(val)
    XPsum += val.amount
}
firstTime = Date.parse(graphable[0].createdAt)
lastTime = Date.parse(graphable[(graphable.length)-1].createdAt)
//Create a graph
let amountOfPoints = 0
let graphPoints = ""
let graphCircles = ""
let texts = ""
let circleID = 0
const offset = 5
const pathRegExp = /([^\/]+)$/
const dateRegExp = /([^T]+)/

    for(let val of graphable){
        //draw circles
        let graphCircle= `<circle id="circleID${circleID}" class="circle" onMouseOver="style.fill='grey'; showGraphData(${circleID})" onMouseOut="style.fill='white'; hideGraphData(${circleID})" r="3" cx="${(toTimestamp(val.createdAt)+offset)}" cy="${(maxHeigth-(((amountOfPoints += val.amount)*maxHeigth)/XPsum))+offset}"/>
        `
        graphCircles += graphCircle
        // Draw text
        let text =`
        <text class="textID${circleID}" x="10" y="20" style="fill:white; display:none;">${(val.path.match(pathRegExp))[0]}</text>
        <text class="textID${circleID}" x="10" y="38" style="fill:white; display:none;">${(val.createdAt.match(dateRegExp))[0]}</text>
        <text class="textID${circleID}" x="10" y="56" style="fill:white; display:none;">XP: ${(val.amount/1000).toFixed(1)}kB</text>
        `
        texts += text
        //draw line
        let graphPoint=`${(toTimestamp(val.createdAt))+offset},${(maxHeigth-(((amountOfPoints)*maxHeigth)/XPsum))+offset} `//whitespace before ` is needed
        graphPoints += graphPoint
        circleID++
    }
    graphInsert =`
    <rect width="510" height="210" style="fill:transparent; stroke-width:6; stroke:#1d1e1f;" />
    <polyline points="${graphPoints}" style="stroke:#00cbce; stroke-width: 2px; fill:none;"></polyline>
    `
    document.getElementById('graph1').insertAdjacentHTML('beforeend', graphInsert)
    document.getElementById('graph1').insertAdjacentHTML('beforeend', graphCircles)
    document.getElementById('graph1').insertAdjacentHTML('beforeend', texts)
    document.getElementById("graph-continer").style.display = "flex"
    
    document.getElementById("hub-userID").innerHTML = `UserID: ${id}`
    document.getElementById("hub-name").innerHTML = `Name: ${firstName} ${lastName}`
    document.getElementById("hub-XP").innerHTML = `Div 01 XP: ${(XPsum/1000).toFixed(0)}kB`
    document.getElementById("hub-audit-ratio").innerHTML = `Audit ratio: ${auditRatio}`

    const totalAuditXp = totalUp+totalDown

    let graph2 =`
    <rect width="510" height="210" style="fill:transparent; stroke-width:6; stroke:#1d1e1f;" />
    <circle r="5" cx="10" cy="32" fill="#00cbce"/>
    <text x="18" y="37" style="fill:white;">${(totalUp/1000000).toFixed(1)}MB Done</text>

    <circle r="5" cx="10" cy="14" fill="#006466"/>
    <text x="18" y="20" style="fill:white;">${(totalDown/1000000).toFixed(1)}MB Received</text>

        <circle r="100" cx="250" cy="105" fill="#006466"/>
        <circle r="50" cx="-105" cy="250" fill="transparent";
            stroke="#00cbce"
            stroke-width="100"
            stroke-dasharray="calc(${((totalUp/totalAuditXp).toFixed(3))*100} * 314.16 / 100) 314.16"
            transform="rotate(-90)" />
        `
    document.getElementById('graph2').insertAdjacentHTML('beforeend', graph2)

    document.getElementById('hub1').style.display = "flex"
    document.getElementById('hub2').style.display = "flex"
    document.getElementById('hub3').style.display = "flex"
})
}

function showGraphData(id){
    const collection = document.getElementsByClassName(`textID${id}`)
    for(let val of collection){
        val.style.display = "block"
    }
}
function hideGraphData(id){
    const collection = document.getElementsByClassName(`textID${id}`)
    for(let val of collection){
        val.style.display = "none"
    }
}

function toTimestamp(strDate){
    var datum = Date.parse(strDate)
    datum -= firstTime
    return (maxWidth*datum)/(lastTime-firstTime)
}

function logOut(){
    localStorage.removeItem("JWTtoken") 
    document.getElementById("login-container").style.display = "flex"
    document.getElementById("logout-container").style.display = "none"
    document.getElementById("graph-continer").style.display = "none"
    document.getElementById('hub1').style.display = "none"
    document.getElementById('hub2').style.display = "none"
    document.getElementById('hub3').style.display = "none"
    document.getElementById("username&Email").value = ""
    document.getElementById("login-password").value = ""
    isLoggedin = false
}