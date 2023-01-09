
const bar = document.getElementById("bar");

const nav = document.getElementById("navbar");

const close = document.getElementById("close");

// function when open
if(bar){
  bar.addEventListener("click" , () => {
    nav.classList.add("active");
  },100); 
  // I have added 100 ms before the active class will be added to the nav menu.
}

// Function when close
if(close){
  close.addEventListener("click" , () => {
    nav.classList.remove("active");
  },100); 
  // I have added 100 ms before the active class will be added to the nav menu.
}


// Function to change products photos in single product secion "Page"
// const mainImg = document.getElementById("mainImg");

// const smallImg = document.getElementsByClassName("small-img");

// smallImg[0].onclick = function(){
//   mainImg.src = smallImg[0].src;
// }
// smallImg[1].onclick = function(){
//   mainImg.src = smallImg[1].src;
// }
// smallImg[2].onclick = function(){
//   mainImg.src = smallImg[2].src;
// }
// smallImg[3].onclick = function(){
//   mainImg.src = smallImg[3].src;
// }

