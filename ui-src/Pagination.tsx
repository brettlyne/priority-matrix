import React from 'react'
import './Pagination.scss'

const UpCaret = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 9" width="14px" height="9px">
  <path stroke="#fff" strokeWidth="2" d="m1 8 6-6 6 6" />
</svg>
const DownCaret = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 9" width="14px" height="9px" style={{ transform: 'scaleY(-1)' }}>
  <path stroke="#fff" strokeWidth="2" d="m1 8 6-6 6 6" />
</svg>

type PaginationProps = {
  pages: React.ReactNode[],
  height: number,
  showDoneButton?: boolean,
  currentPage: number,
  setCurrentPage: Function
};

const Pagination = ({ pages, height, currentPage, setCurrentPage, showDoneButton = true }: PaginationProps) => {

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="Pagination" style={{ height: `${height}px` }}>
      <div
        className="PaginationInner"
        style={{ height: `${height * pages.length}px`, transform: `translateY(${-currentPage * height}px)` }}
      >
        {pages.map((page, i) => (
          <div style={{ height: `${height}px` }}>
            {page}
          </div>
        ))}
      </div>

      <div className="PaginationFooter">

        {showDoneButton &&
          <button
            onClick={() => parent?.postMessage?.({ pluginMessage: JSON.stringify({ msgType: 'closePlugin' }) }, '*')}
          >
            All done
          </button>
        }
        <div className="Pagination_page-number">
          <p>{currentPage + 1} of {pages.length}</p>
          <div className="button-group">
            <button className={currentPage <= 0 ? 'disabled' : ''} onClick={prevPage}><UpCaret /></button>
            <button className={currentPage >= pages.length - 1 ? 'disabled' : ''} onClick={nextPage}><DownCaret /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Pagination
