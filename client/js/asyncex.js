async function main() {
    let response = await fetch('/getkey');
    let data = await response.text();
    console.log(data)
    // now keep going
}

main()
