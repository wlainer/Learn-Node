exports.homeController = (req, res) => {
  res.render('index');
}



exports.addStore = (req, res) => {
  res.render('editStore', {
    title:'Add Store'
  });
}