import { Dispatch, SetStateAction } from "react"

const sortTable = (e: MouseEvent | TouchEvent, colNum: number, sortedAsc: boolean, setSortedAsc: Dispatch<SetStateAction<boolean>>): void => {
  let table, rows, switching, i, x, y, shouldSwitch

  table = document.getElementById('tbOp')
  switching = true

  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false
    rows = (table! as HTMLTableElement).rows
    /*Loop through all table rows (except the
      first, which contains table headers):*/
    for (i = 2; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName('TD')[colNum]
      y = rows[i + 1].getElementsByTagName('TD')[colNum]

      //check if the two rows should switch place:
      if (!sortedAsc) {
        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
          //if so, mark as a switch and break the loop:
          shouldSwitch = true
          break
        }
      } else {
        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
          //if so, mark as a switch and break the loop:
          shouldSwitch = true
          break
        }
      }
    }
    if (!sortedAsc) {
      setSortedAsc(true)
    } else {
      setSortedAsc(false)
    }

    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode!.insertBefore(rows[i + 1], rows[i])
      switching = true
    }
  }
}

export default sortTable