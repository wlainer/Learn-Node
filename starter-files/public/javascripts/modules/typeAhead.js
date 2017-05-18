const axios = require('axios');
const dompurify = require('dompurify');

function searchResultsHTML(stores) {
  return stores.map(store => {
    return `
      <a href="/store/${store.slug}" class="search__result">
        <strong>${store.name}</strong>
      </a>`;
  }).join('');
}


function typeAhead(search) {
  if (!search) return;

  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');

searchInput.on('input', function() {
  if (!this.value) {
    searchResults.style.display = 'none';
    return;
  }

  searchResults.style.display = 'block';

  axios.get(`/api/search?q=${this.value}`)
    .then(res => {
      if (res.data.length) {
        const html = dompurify.sanitize(searchResultsHTML(res.data));
        searchResults.innerHTML = html;
        return;
      }

      searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">
      No results for ${this.value} found!</div>`);
    })
    .catch(err => {
      console.error(err);
    })
})

searchInput.on('keyup', (e) => {
  //if they arent pressing up, down or enter, who cares!
  if (![38,40,13].includes(e.keyCode)) {
    return
  } 

  const activeClass = 'search__result--active';
  const current = search.querySelector(`.${activeClass}`);
  const itens = search.querySelectorAll('.search__result');
  let next;
  if (e.keyCode === 40 && current) {
    next = current.nextElementSibling || itens[0];
  } else if (e.keyCode === 40) {
    next = itens[0];
  } else if (e.keyCode === 38 && current) {
    next = current.previousElementSibling || itens[itens.length-1]
  } else if (e.keyCode === 38) {
    next = itens[itens.length - 1];
  } else if (e.keyCode === 13 && current.href) {
    window.location = current.href;
    return;
  }
  
  if (current) {
    current.classList.remove(activeClass);
  }
  next.classList.add(activeClass);

})

}


export default typeAhead;
