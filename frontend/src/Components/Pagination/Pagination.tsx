import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import Button from '../Button/Button'

interface Props {
  allDatas: Record<string, any>[]
  itemsPerPage: number
  currPage: number
  setCurrPage: Dispatch<SetStateAction<number>>
  handlerListsItemPerPage: (lists: Record<string, any>[], itemPerPage: number, currPage: number, setState: Dispatch<SetStateAction<any>>) => void
  setListsItemPerPage: Dispatch<SetStateAction<any>>
}

const Pagination = ({ allDatas, itemsPerPage, currPage, setCurrPage, handlerListsItemPerPage, setListsItemPerPage }: Props) => {
  const ref = useRef(false)
  const [totalPages, setTotalPages] = useState<number>(Math.ceil(allDatas.length / itemsPerPage))
  const [pages, setPages] = useState<any[]>([])

  const handleSelectPageNum = (e: React.MouseEvent) => {
    const page: number = Number((e.target as HTMLDivElement).dataset.page)
    if (page < 1 || page > totalPages) return
    setCurrPage(page)
  }

  const changePage = async (e: React.MouseEvent | React.TouchEvent, currPage: number, setState: Dispatch<SetStateAction<number>>): Promise<void> => {
    e.preventDefault()
    e.stopPropagation()
    const dir: number = await Number((e.currentTarget as HTMLButtonElement).value)
    if (currPage + dir < 1 || currPage + dir > totalPages) return
    setState(prevValue => prevValue + dir)
  }

  const getVisiblePages = (): void => {
    const pageNumbers: any[] = []
    pageNumbers.push(1)
    if (currPage > 3) {
      pageNumbers.push('...');
    }

    for (let i = Math.max(2, currPage - 1); i <= Math.min(totalPages - 1, currPage + 1); i++) {
      pageNumbers.push(i)
    }

    if (currPage < totalPages - 2) {
      pageNumbers.push('...');
    }

    if (totalPages > 1) { 
      pageNumbers.push(totalPages)
    }
    setPages(pageNumbers)
  }

  useEffect(() => {
    getVisiblePages()
  }, [currPage])

  useEffect(() => {
    if (!ref.current) {
      ref.current = true
      getVisiblePages()
    }
  }, [totalPages])

  useEffect(() => {
    // reset current page to first when changes itemsPerPage
    setCurrPage(1)
    ref.current = false
  }, [itemsPerPage])

  useEffect(() => {
    handlerListsItemPerPage(allDatas, itemsPerPage, currPage, setListsItemPerPage)
    setTotalPages(Math.ceil(allDatas.length / itemsPerPage))
  }, [currPage, itemsPerPage, allDatas])

  return (
    <div id='paginationUserDashboard' className='d-flex justify-content-center align-items-center'>
      <Button type='button' name='prevPage' id='prevPage' className='prevPage' value={-1} innerText='fa fa-arrow-left' useIconFA={true} onClick={(e: React.MouseEvent | React.TouchEvent) => changePage(e, currPage, setCurrPage)} />
      <div className='pagination d-flex justify-content-center align-items-center'>
        {
          pages.map((number: any, i: number) => {
            if (typeof number === 'string') {
              return (
                <div
                  key={i}
                  className='paginationNum spreadDot'
                  data-page={number}
                >
                  {number}
                </div>
              )
            }
            return (
              <div
                key={i}
                className={`paginationNum ${currPage === number ? 'active' : ''}`}
                data-page={number}
                onClick={(e: React.MouseEvent) => handleSelectPageNum(e)}>{number}
              </div>
            )
          })
        }
      </div>
      <Button type='button' name='nextPage' id='nextPage' className='nextPage' value={1} innerText='fa fa-arrow-right' useIconFA={true} onClick={(e: React.MouseEvent | React.TouchEvent) => changePage(e, currPage, setCurrPage)} />
    </div>
  )
}

export default Pagination