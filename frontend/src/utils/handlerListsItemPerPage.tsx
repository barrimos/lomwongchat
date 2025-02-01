import { Dispatch, SetStateAction } from "react"

const handlerListsItemPerPage = (list: Record<string, any>[], itemPerPage: number, currPage: number, setState: Dispatch<SetStateAction<any>>) => {
  if (list.length === 0) return
  const start: number = (currPage - 1) * itemPerPage
  const end: number = currPage * itemPerPage
  const newLists: Record<string, any>[] = list.slice(start, end)

  setState(newLists)
}

export default handlerListsItemPerPage