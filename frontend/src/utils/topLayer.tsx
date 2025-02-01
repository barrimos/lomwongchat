const topLayer = (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    const currModal: Element | null = document.querySelector('.modal.topLayer.active')
    if (currModal) {
        currModal.classList.remove('topLayer')
    }
    if ((e.target as HTMLElement).closest('.modal.active')) {
        (e.target as HTMLElement).closest('.modal.active')!.classList.add('topLayer');
    } else {
        (e.target as HTMLElement).classList.add('topLayer')
    }
}

export default topLayer