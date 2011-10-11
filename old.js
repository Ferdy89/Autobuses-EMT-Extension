function refLineas(){
    $("#fresquisimo input:checkbox").change(refreshcar);
    $("#fresquisimo a").click(favorito);
    getLineas();
}
function print_favoritos(){
    // Obtengo los favoritos del localStorage
    var favs;
    if (localStorage['favoritos']){
        favs = localStorage.getObject('favoritos');
    } else {
        favs = [];
    }
    // Genero el html de Favoritos
    $("#favoritos").html("");
    $("#favoritos").append('<table><tr>');
    // Recorro el array de favoritos y voy pidiendo e imprimiendo los tiempos
    for (var i=0;i<favs.length;i++){
        var fav = favs[i];
        var tag = "#div" + fav[1] + fav[2];
        width = width + 50;
        if (width >= 500 && !favs_vistos){
            var ancho = width + 'px';
            $("body").css("width",ancho);
            favs_vistos = true;
        }
        $("#favoritos").append('<td class="favs"><strong>'+ fav[0] +'</strong><br>&nbsp;<div id="div'+ fav[1] + fav[2] +'"></div></td>');
        getTiempo(fav[1],fav[2],$(tag));
    }
    $("#favoritos").append('</tr></table><hr>');
}

/*function getLineas(){
    // Llamo a la página de espera de tiempos de la EMT
    $.get("http://www.emtmadrid.es/Home.aspx", function(data){
        // Genero el html de la selección de línea
        var lineas = $(data).find("#ctl00_ContentPlaceHolder1_repeaterTiempoEsperaDerecha_ctl00_ctl00_ComboLineasBloqueTiempoEspera_cbLineas").html();
        var insercion = '<label for="lineas">Selecciona la línea:</label><select name="lineas">';
        insercion = insercion + lineas;
        insercion = insercion + '</select><hr>';
        // Inserto el formulario de líneas
        $("#linea").html(insercion);
        // Asocio la acción ante una selección
        $("#linea select").change(getParadas);
    });
}*/
function getParadas(){
    // Oculto los div que no deben mostrarse
    $("#parada").addClass("hid");
    $("#tiempo").addClass("hid");
    $("#fresquisimo").addClass("hid");
    $("#refrescar").removeAttr("checked"); refreshcar();
    // Guardo la información relevante de la línea que está siendo consultada
    linea = ($("#linea select option:selected").attr("linea"));
    num_linea = $("#linea select").val();
    // Cuando se selecciona una línea llamo a la página correspondiente
    $.get("http://www.emtmadrid.es/Home/Destacados/Tiempo-que-falta-para-que-venga-mi-autobus.aspx?linea="+num_linea, function(data){
        // Busco e inserto el cachito correspondiente a las paradas
        var z = $(data).find("div.labels2 p");
        $("#parada").html(z[2].innerHTML + '<br>' + z[3].innerHTML + '<hr>');
        // Asocio los cambios de selección con la actualización del tiempo de espera
        $("#ctl00_ContentPlaceHolder1_repeaterTiempoEspera_ctl00_ctl00_TiempoEsperaAutobus1_cbParadas1").change(function(){parada=$(this).val();getTiempo(linea, parada, $("#tiempo"));$("#tiempo").removeClass("hid");$("#fresquisimo").removeClass("hid");});
        $("#ctl00_ContentPlaceHolder1_repeaterTiempoEspera_ctl00_ctl00_TiempoEsperaAutobus1_cbParadas2").change(function(){parada=$(this).val();getTiempo(linea, parada, $("#tiempo"));$("#tiempo").removeClass("hid");$("#fresquisimo").removeClass("hid");});
        // Muestro el div de seleccion de parada
        $("#parada").removeClass("hid");
    });
}
function getTiempo(gtlinea, gtparada, gtdiv){
    // Pido el tiempo para una línea y una parada y lo pongo en su div
    $.get("http://www.emtmadrid.es/aplicaciones/Espera.aspx?parada=" + gtparada + "&linea=" + gtlinea, function(data){
        gtdiv.html($(data).find("#Label3").html());
    });
}
function refreshcar(){ // Controla el autorefresco
    if($("#fresquisimo input:checkbox").is(":checked")){
        actualizar = setInterval(function (){getTiempo(linea, parada, $('#tiempo'));}, 500);
    } else {
        clearInterval(actualizar);
    }
}
function favorito(){ // Guarda una ruta en favoritos
    alert("A punto de hacer un prompt");
    var nombre = prompt('Asigna un nombre a esta ruta:');
    if (nombre!=null && nombre!=""){
        var new_fav = [nombre,linea,parada];
        var favs;
        if (localStorage['favoritos']){
            favs = localStorage.getObject('favoritos');
        } else {
            favs = [];
        }
        favs[favs.length] = new_fav;
        localStorage.setObject('favoritos', favs);
    }
}