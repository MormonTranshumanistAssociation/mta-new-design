function initializeParallax(clip) {
  const parallax = clip.querySelectorAll('*[parallax]');
  const parallaxDetails = [];
  let sticky = false;

  if (getComputedStyle(document.body).transform === 'none') {
    document.body.style.transform = 'translateZ(0)';
  }
  const fixedPos = document.createElement('div');
  fixedPos.style.position = 'fixed';
  fixedPos.style.top = '0';
  fixedPos.style.width = '1px';
  fixedPos.style.height = '1px';
  fixedPos.style.zIndex = 1;
  document.body.insertBefore(fixedPos, document.body.firstChild);

  parallax.forEach(elem => {
    const container = elem.parentNode;
    const containerParent = container.parentNode;
    if (getComputedStyle(container).overflow !== 'visible') {
      console.error('Need non-scrollable container to apply perspective for', elem);
      return;
    }
    if (clip && container.parentNode !== clip) {
      console.warn('Currently we only track a single overflow clip, but elements from multiple clips found.', elem);
    }
    if (getComputedStyle(containerParent).overflow === 'visible') {
      console.error('Parent of sticky container should be scrollable element', containerParent);
    }
    let perspectiveElement;
    perspectiveElement = containerParent;
    container.style.transformStyle = 'preserve-3d';
    perspectiveElement.style.perspectiveOrigin = 'bottom right';
    perspectiveElement.style.perspective = '1px';
    elem.style.transformOrigin = 'bottom right';

    // Find the previous and next elements to parallax between.
    let previousCover = elem.previousElementSibling;
    while (previousCover && previousCover.hasAttribute('parallax')) {
      previousCover = previousCover.previousElementSibling;
    }
    let nextCover = elem.nextElementSibling;
    while (nextCover && !nextCover.hasAttribute('parallax-cover')) {
      nextCover = nextCover.nextElementSibling;
    }
    parallaxDetails.push({'node': elem,
                          'top': elem.offsetTop,
                          'sticky': !!sticky,
                          'nextCover': nextCover,
                          'previousCover': previousCover});
  });

  // Add a scroll listener to hide perspective elements when they should no
  // longer be visible.
  clip.addEventListener('scroll', function() {
    parallaxDetails.forEach(elem => {
      const container = elem.node.parentNode;
      const previousCover = elem.previousCover;
      const nextCover = elem.nextCover;
      const parallaxStart = previousCover ? (previousCover.offsetTop + previousCover.offsetHeight) : 0;
      const parallaxEnd = nextCover ? nextCover.offsetTop : container.offsetHeight;
      const threshold = 500;
      const visible = parallaxStart - threshold - clip.clientHeight < clip.scrollTop && parallaxEnd + threshold > clip.scrollTop;
    });
  });
  window.addEventListener('resize', onResize.bind(null, parallaxDetails));
  onResize(parallaxDetails);
  parallax.forEach(elem => {
    elem.parentNode.insertBefore(elem, elem.parentNode.firstChild);
  });
}

function onResize(details) {
  details.forEach(detail => {
    const container = detail.node.parentNode;
    const clip = container.parentNode;
    const previousCover = detail.previousCover;
    const nextCover = detail.nextCover;
    const rate = detail.node.getAttribute('parallax');
    const parallaxStart = previousCover ? (previousCover.offsetTop + previousCover.offsetHeight) : 0;
    const scrollbarWidth = details.sticky ? 0 : clip.offsetWidth - clip.clientWidth;
    const parallaxElem = detail.sticky ? container : clip;
    const height = detail.node.offsetHeight;
    let depth = 0;
    if (rate) {
      depth = 1 - (1 / rate);
    } else {
      const parallaxEnd = nextCover ? nextCover.offsetTop : container.offsetHeight;
      depth = (height - parallaxEnd + parallaxStart) / (height - clip.clientHeight);
    }
    if (detail.sticky) {
      depth = 1.0 / depth;
    }
    const scale = 1.0 / (1.0 - depth);
    // The scrollbar is included in the 'bottom right' perspective origin.
    const dx = scrollbarWidth * (scale - 1);
    // Offset for the position within the container.
    const dy = detail.sticky ? -(clip.scrollHeight - parallaxStart - height) * (1 - scale) : (parallaxStart - depth * (height - clip.clientHeight)) * scale;
    detail.node.style.transform = 'scale(' + (1 - depth) + ') translate3d(' + dx + 'px, ' + dy + 'px, ' + depth + 'px)';
  });
}

export { initializeParallax };