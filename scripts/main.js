

document.querySelector('.get-started').addEventListener('mouseover', function() {
      this.style.transform = 'scale(1.1) translateY(-3px)';
  });
  document.querySelector('.get-started').addEventListener('mouseout', function() {
      this.style.transform = 'scale(1) translateY(0)';
  });


  // mobile events
  document.querySelector('.get-started').addEventListener('touchstart', function() {
      this.style.transform = 'scale(1.1) translateY(-3px)';
  });
  document.querySelector('.get-started').addEventListener('touchmove', function() {
      this.style.transform = 'scale(1) translateY(0)';
  });