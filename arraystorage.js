// Cacho pegao de internet pa guardar objetos o arrays en localStorage
Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}
Storage.prototype.getObject = function(key) {
    return JSON.parse(this.getItem(key));
}
// Fin del cacho pegao de internet