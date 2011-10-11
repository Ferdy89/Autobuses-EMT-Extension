$(function () {
    // Extensión init, minimizar al máximo
    
    // Llamada dummy que se repite cada minuto
    // <sarcasmo> Gracias, señores ingenieros diseñadores de la web de la EMT por proporcionar una API tan cojonuda </sarcasmo>
    $.get("http://www.emtmadrid.es/Servicios/lineas.aspx?mapaFiltro=15611");
    setInterval(function () {
            $.get("http://www.emtmadrid.es/Servicios/lineas.aspx?mapaFiltro=15611");
        }, 
        20000
    );
    
    // Inicializar favoritos
    if (!localStorage['favoritos']) {
        console.log('No hay favoritos guardados');
        localStorage['favoritos'] = {};
        localStorage['favsmaxid'] = 0;
    }
});

var consultas = {};

function nuevaConsulta(favid) {
    if (favid) {
        new consulta().init(favid);
    } else {
        var aux = new consulta();
        var id = aux.init(favid);
        consultas[id] = aux;
    }
}

function mostrarFavs() {
    if ($('#favoritos').css('display') == 'none') {
        getPrintFavs();
        $('#favoritos').css('display','block')
        $('#favsMenu').html('OCULTAR FAVORITOS');
    } else {
        $('#favoritos').css('display','none')
        $('#favsMenu').html('MOSTRAR FAVORITOS');
    }
}

function getPrintFavs() {
    $('#favs').html('');
    var htmlcode1 = '<li>' +
                        '<a href="javascript:nuevaConsulta('
    var htmlcode2 =     ')">'
    var htmlcode3 =     '</a>' +
                    '</li>'
    for (f in favoritos) {
        $('#favs').append(htmlcode1 + f.id + htmlcode2 + f.numLinea + f.parada + htmlcode3);
    }
}

function sacaTiempos (letrero) {
    var bus1;
    var bus2;
    console.log(letrero);
    if (letrero.match(/entorno/i)) {
        bus1 = 0;
        bus2 = letrero.replace(/EMT Informa: Autobús en entorno de parada. El siguiente llegara en  /,'').replace(/ minutos.<br>/,'') - 0;
    } else if (letrero.match(/superior/i) && letrero.match(/estimado/i)) {
        bus1 = bus1 = letrero.replace(/EMT Informa: Tiempo estimado de llegada: /,'').replace(/ minutos. El siguiente autobús llegará en un tiempo superior a 20 minutos.<br>/,'') - 0;
        bus2 = '20+';
    } else if (letrero.match(/entorno/i) && letrero.match(/superior/i)) {
        bus1 = 0;
        bus2 = '20+';
    } else if (letrero.match(/superior/i)) {
        bus1 = '20+';
        bus2 = '20+';
    } else if (letrero.match(/estimado/i)) {
        //var letrCopy = letrero;
        bus1 = letrero.replace(/EMT Informa: Tiempo estimado de llegada: /,'').replace(/ minutos. El siguiente autobús llegará en \d+ minutos.<br>/,'') - 0;
        bus2 = letrero.replace(/EMT Informa: Tiempo estimado de llegada: \d+ minutos. El siguiente autobús llegará en /,'').replace(/ minutos.<br>/,'') - 0;
    } else if (letrero.match(/favor/i)) {
        //var letrCopy = letrero;
        bus1 = 'error';
        bus2 = 'Fail: no quedan autobuses para esta parada';
    } else {
        $.get("http://www.emtmadrid.es/Servicios/lineas.aspx?mapaFiltro=211"); // Te odio, EMT
        bus1 = 'error';
        bus2 = 'Algo desconocido ha sucedido. Reporta este error si quieres ayudar ;)<br />Recuerda indicar cómo reproducir el fallo';
    }
    return { bus1: bus1, bus2: bus2 };
}

var maxid = 0;
var favoritos = {};
var favsmaxid = 0;

function consulta () {
    this.id = 0;
    // LINEA
    this.boolLinea = false;
    this.linea = 0;
    this.numLinea;
    // SENTIDO
    this.boolSentido = false;
    this.cacheSentido = false;
    this.sentido = 0; 
    this.sentName = {};
    // PARADA
    this.boolParada = false;
    this.cacheParadas = false;
    this.parada = 0;
    // AUTOREF
    this.actualizar = false;
    this.intervalo;
    // FAVORITOS
    this.favoritos = false;
    this.favId;
    // ALARMA
    this.boolAlarma = false;
    this.alarmOn = false;
    this.alarma = 0;
    
    // Probablemente el método más importante de toda la extensión
    this.init = function (favid) {
        if (favid) console.log('Creado objeto favorito'); else console.log('Creado objeto nuevo');
        this.id = maxid++;
        var htmlcode =  '<li id="consulta' + this.id + '">' +
                            '<table class="objConsulta">' + 
                                '<tr>' +
                                    '<td>' +
                                        '<a href="javascript:consultas[' + this.id + '].eventFav();"><img src="favOff.png" id="favIcon' + this.id + '" align="left" /></a>' +
                                        '<a href="javascript:consultas[' + this.id + '].eventAlarm();"><img src="alarmOff.png" id="alarmIcon' + this.id + '" align="left" /></a>' +
                                        '<a href="javascript:consultas[' + this.id + '].eventRef();"><img src="refOff.png" id="refIcon' + this.id + '" align="left" /></a>' + 
                                        '<a href="javascript:consultas[' + this.id + '].eventClose();"><img src="close.png" align="right" /></a>' +
                                    '</td>' +
                                '</tr>' +
                                '<tr id="alarmMenu' + this.id + '" style="display: none;">' +
                                    '<td width="198">' +
                                        '<table>' +
                                            '<tr>' +
                                                '<td id="cabAlarma' + this.id + '" class="colapsable" onclick="javascript:consultas[' + this.id + '].eventMenuAlarma();">ALARMA</td>' +
                                            '</tr>' +
                                            '<tr id="alarm' + this.id + '">' +
                                                '<td align="center"><h6>avisar a <input type="text" size="1" value="' + this.alarma + '" onchange="javascript:consultas[' + this.id + '].changeAlarm(this.value);" /> minutos</h6></td>' +
                                            '</tr>' +
                                        '</table>' +
                                    '</td>' +
                                '</tr>' +
                                '<tr id="lineaMenu' + this.id + '">' +
                                    '<td>' +
                                        '<table>' +
                                            '<tr>' +
                                                '<td class="colapsable" id="cabLinea' + this.id + '" onclick="javascript:consultas[' + this.id + '].eventLinea();">LÍNEA</td>' +
                                            '</tr>' +
                                            '<tr id="linea' + this.id + '">' +
                                            '</tr>' + 
                                        '</table>' +
                                    '</td>' +
                                '</tr>' +
                                '<tr id="sentidoMenu' + this.id + '" style="display: none;">' +
                                    '<td width="198">' +
                                        '<table>' +
                                            '<tr>' +
                                                '<td class="colapsable" id="cabSentido' + this.id + '" onclick="javascript:consultas[' + this.id + '].eventSentido();">SENTIDO</td>' +
                                            '</tr>' +
                                            '<tr id="sentido' + this.id + '">' +
                                            '</tr>' +
                                        '</table>' +
                                    '</td>' +
                                '</tr>' +
                                '<tr id="paradaMenu' + this.id + '" style="display: none;">' +
                                    '<td width="198">' +
                                        '<table>' +
                                            '<tr>' +
                                                '<td class="colapsable" id="cabParada' + this.id + '" onclick="javascript:consultas[' + this.id + '].eventParada();">PARADA</td>' +
                                            '</tr>' +
                                            '<tr id="parada' + this.id + '">' +
                                                '<td>' +
                                                    '<select onchange="javascript:consultas[' + this.id + '].changeParada($(this).children(' + "'" + ':selected' + "'" + '));">' +
                                                    '</select>' +
                                                '</td>' +
                                            '</tr>' + 
                                        '</table>' +
                                    '</td>' +
                                '</tr>' +
                                '<tr id="tiempo' + this.id + '">' +
                                    '<td align="center">'
                                    '</td>'
                                '</tr>' +
                            '</table>' +
                        '</li>';
        $('#consultas').append(htmlcode);
        if (favid) {
            // Guardo la info del favorito
            this.linea = favoritos[favid].linea;
            this.numLinea = favoritos[favid].numLinea;
            this.sentido = favoritos[favid].sentido;
            this.sentName = favoritos[favid].sentName;
            this.parada = favoritos[favid].parada;
            
            // Oculto lo poco visible que hay en un inicio
            var tag = '#lineaMenu' + this.id;
            $(tag).css('display', 'none');
            
            // Cargo el tiempo, sin florituras
            this.loadTiempos();
        } else {
            this.printLineas();
        }
        return this.id;
    }
    this.eventLinea = function () {
        // Me encargo del tiempo
        var tag = '#tiempo' + this.id;
        $(tag).html('<td></td>');
        
        // Me encargo de las paradas
        this.boolParada = false;
        this.cacheParadas = false;
        tag = '#parada' + this.id;
        $(tag).html('<td></td>').css('display', 'block');
        tag = '#cabParada' + this.id;
        $(tag).html('PARADA');
        tag = '#paradaMenu' + this.id;
        $(tag).css('display', 'none');
        
        // Me encargo de los sentidos
        this.boolSentido = false;
        this.cacheSentido = false;
        tag = '#sentido' + this.id;
        $(tag).html('<td></td>').css('display', 'block');
        tag = '#cabSentido' + this.id;
        $(tag).html('SENTIDO');
        tag = '#sentidoMenu' + this.id;
        $(tag).css('display', 'none');
        
        // Desactivo posibles alarmas o autoRef
        if (this.alarmOn) this.eventAlarm();
        if (this.actualizar) this.eventRef();
        
        // Muestro el menú y cambio el nombre de la cabecera colapsable
        tag = '#cabLinea' + this.id;
        $(tag).html('LINEA');
        tag = '#linea' + this.id;
        $(tag).css('display','block');
        
        // Recargo las líneas
        this.printLineas();
    }
    this.changeLinea = function ($linea) {
        // Guarda la seleccion
        this.boolLinea = true;
        this.linea = $linea.val();
        this.numLinea = $linea.attr('linea');
        
        // Cambiar nombre de la cabecera colapsable LÍNEA
        var tag = '#cabLinea' + this.id;
        $(tag).html('LINEA: ' + $linea.attr('linea'));
        
        // Colapsar el lineaMenu
        tag = '#linea' + this.id;
        $(tag).css('display','none');
        
        // Mostrar sentido
        tag = '#sentidoMenu' + this.id;
        $(tag).css('display','block');
        
        // Cargar sentidos
        tag = '#sentido' + this.id;
        if (!this.cacheSentido) {
            var loadingcode = '<p align="center"><img src="loading.gif" /></p>';
            $(tag).html('<td>' + loadingcode + '</td>');
            var htmlcode1 = '<td>' +
                                '<ul>' +
                                    '<li><a href="javascript:consultas[' + this.id + '].eventSent(1);"><h6 id="sent1' + this.id + '">';
            var htmlcode2 = '</h6></a></li><br />' + 
                            '<li><a href="javascript:consultas[' + this.id + '].eventSent(2);"><h6 id="sent2' + this.id + '">';
            var htmlcode3 =         '</h6></a></li>' +
                                '</ul>' +
                            '</td>';
            var ref = this;
            $.get("http://www.emtmadrid.es/Home/Destacados/Tiempo-que-falta-para-que-venga-mi-autobus.aspx?linea=" + this.linea, function(data){
                ref.cacheSentido = true;
                ref.sentName[1] = $(data).find('[for=ctl00_ContentPlaceHolder1_repeaterTiempoEspera_ctl00_ctl00_TiempoEsperaAutobus1_cbParadas1]').html().replace(/Línea con sentido <br>/g, '');
                ref.sentName[2] = $(data).find('[for=ctl00_ContentPlaceHolder1_repeaterTiempoEspera_ctl00_ctl00_TiempoEsperaAutobus1_cbParadas2]').html().replace(/Línea con sentido <br>/g, '');
                $(tag).html(htmlcode1 + ref.sentName[1] + htmlcode2 + ref.sentName[2] + htmlcode3);
            });
        }
    }
    this.eventSent = function (num) {
        // Mirar a ver si es una selección distinta a la ya realidada
        if (num != this.sentido) {
            this.cacheParadas = false;
        }
        
        // Registrar la selección
        this.boolSentido = true;
        this.sentido = num;
        
        // Cambiar el nombre de la cabecera colapsable SENTIDO
        var tag = '#cabSentido' + this.id;
        $(tag).html('SENTIDO: ' + this.sentName[num]);
        
        // Colapsar el sentido
        tag = '#sentido' + this.id;
        $(tag).css('display','none');
        
        // Mostrar parada
        tag = '#paradaMenu' + this.id;
        $(tag).css('display','block');
        
        this.loadParadas();
    }
    this.loadParadas = function () {
        if (!this.cacheParadas) {
            // Cargar parada
            var loadingcode = '<p align="center"><img src="loading.gif" /></p>';
            var tag = '#parada' + this.id;
                $(tag).html('<td>' + loadingcode + '</td>');
                var htmlcode1 = '<td>' +
                                    '<select onchange="javascript:consultas[' + this.id + '].changeParada($(this).children(' + "'" + ':selected' + "'" + '));">';
                var htmlcode2 =     '</select>' +
                                '</td>';
            var ref = this;
            $.get("http://www.emtmadrid.es/Home/Destacados/Tiempo-que-falta-para-que-venga-mi-autobus.aspx?linea=" + this.linea, 
                function(data){
                    var tag2 = '#ctl00_ContentPlaceHolder1_repeaterTiempoEspera_ctl00_ctl00_TiempoEsperaAutobus1_cbParadas' + ref.sentido;
                    $(tag).html(htmlcode1 + $(data).find(tag2).html().replace(/></,'>Selecciona una línea...<') + htmlcode2);
                }
            );
            this.cacheParadas = true;
        }
    }
    this.eventSentido = function () {
        // Me encargo del tiempo
        var tag = '#tiempo' + this.id;
        $(tag).html('<td></td>');
        
        // Me encargo de las paradas
        this.boolParada = false;
        tag = '#parada' + this.id;
        $(tag).css('display', 'block');
        tag = '#cabParada' + this.id;
        $(tag).html('PARADA');
        tag = '#paradaMenu' + this.id;
        $(tag).css('display', 'none');
        
        // Me encargo de los sentidos
        this.boolSentido = true;
        tag = '#cabSentido' + this.id;
        $(tag).html('SENTIDO');
        tag = '#sentido' + this.id;
        $(tag).css('display','block');
        
        // Cargar sentidos
        if (!this.cacheSentido) {
            var loadingcode = '<p align="center"><img src="loading.gif" /></p>';
            $(tag).html('<td>' + loadingcode + '</td>');
            var htmlcode1 = '<td>' +
                                '<ul>' +
                                    '<li><a href="javascript:consultas[' + this.id + '].eventSent(1);"><h6 id="sent1' + this.id + '">';
            var htmlcode2 = '</h6></a></li><br />' + 
                            '<li><a href="javascript:consultas[' + this.id + '].eventSent(2);"><h6 id="sent2' + this.id + '">';
            var htmlcode3 =         '</h6></a></li>' +
                                '</ul>' +
                            '</td>';
            var ref = this;
            $.get("http://www.emtmadrid.es/Home/Destacados/Tiempo-que-falta-para-que-venga-mi-autobus.aspx?linea=" + this.linea, function(data){
                ref.cacheSentido = true;
                ref.sentName[1] = $(data).find('[for=ctl00_ContentPlaceHolder1_repeaterTiempoEspera_ctl00_ctl00_TiempoEsperaAutobus1_cbParadas1]').html().replace(/Línea con sentido <br>/g, '');
                ref.sentName[2] = $(data).find('[for=ctl00_ContentPlaceHolder1_repeaterTiempoEspera_ctl00_ctl00_TiempoEsperaAutobus1_cbParadas2]').html().replace(/Línea con sentido <br>/g, '');
                $(tag).html(htmlcode1 + ref.sentName[1] + htmlcode2 + ref.sentName[2] + htmlcode3);
            });
        }
        
        // Desactivo posibles alarmas o autoRef
        if (this.alarmOn) this.eventAlarm();
        if (this.actualizar) this.eventRef();
    }
    this.eventParada = function () {
        // Me encargo del tiempo
        var tag = '#tiempo' + this.id;
        $(tag).html('<td></td>');
        
        // Me encargo de las paradas
        this.boolParada = true;
        tag = '#parada' + this.id;
        $(tag).css('display','block');
        tag = '#cabParada' + this.id;
        $(tag).html('PARADA');
        
        // Desactivo posibles alarmas o autoRef
        if (this.alarmOn) this.eventAlarm();
        if (this.actualizar) this.eventRef();
        
        this.loadParadas();
    }
    this.changeParada = function ($parada) {
        // Registrar selección
        this.boolParada = true;
        this.parada = $parada.val();
        
        // Cambiar el nombre de la cabecera colapsable parada
        var tag = '#cabParada' + this.id;
        $(tag).html('PARADA: ' + $parada.html());
        
        this.loadTiempos();
    }
    this.loadTiempos = function () {
        // Colapsar las paradas
        var tag = '#parada' + this.id;
        $(tag).css('display','none');
        
        // Mostrar el tiempo
        tag = '#tiempo' + this.id;
        $(tag).css('display','block');
        
        var loadingcode = '<p align="center"><img src="loading.gif" /></p>';
        tag = '#tiempo' + this.id;
        $(tag).html('<td>' + loadingcode + '</td>');
        // Cargar tiempo
        $.get("http://www.emtmadrid.es/aplicaciones/Espera.aspx?parada=" + this.parada + "&linea=" + this.numLinea, function(data){
                var tiempos = sacaTiempos($(data).find("#Label3").html());
                if (tiempos.bus1 == 'error') {
                    $(tag).html('<td><h6>' + tiempos.bus2 + '</h6></td>');
                } else {
                    $(tag).html('<td><ul><li><h6>Primero en ' + tiempos.bus1 + ' minutos</h6></li><br /><li><h6>Siguiente en ' + tiempos.bus2 + ' minutos</h6></li><br /></ul></td>');
                }
            }
        );
    }
    this.eventFav = function () { // TODO
        if (this.favoritos) { // Era favorito, lo cierro
            favoritos.removeItem(this.favId);
            this.favorito = false;
        } else { // No era favorito, lo hago
            this.favId = favsmaxid++;
            this.cacheSentido = false;
            this.cacheParadas = false;
            favoritos[this.favId] = this;
            alert(favoritos[this.favId].cacheSentido);
            this.favorito = true;
        }
        localStorage['favoritos'] = favoritos;
        localStorage['favsmaxid'] = favsmaxid;
    }
    this.eventAlarm = function () {
        if (this.alarmOn) { // Si la alarma estaba activada
            // Registro la desactivación
            this.alarmOn = false;
            
            // Cambio el icono
            var tag = '#alarmIcon' + this.id;
            $(tag).attr('src', 'alarmOff.png');
            
            // Oculto el menú
            this.boolAlarma = false;
            tag = '#alarmMenu' + this.id;
            $(tag).css('display', 'none');
            
        } else { // La alarma no estaba activada
            if (this.boolAlarma) { // El menú alarma estaba desplegado
                // Oculto el menú
                this.boolAlarma = false;
                tag = '#alarmMenu' + this.id;
                $(tag).css('display', 'none');
            } else { // El menú alarma no estaba desplegado
                // Muestro el menú
                this.boolAlarma = true;
                tag = '#alarmMenu' + this.id;
                $(tag).css('display', 'block');
                tag = '#alarm' + this.id;
                $(tag).css('display', 'block');
            }
        }
    }
    this.eventMenuAlarma = function () {
        var tag = '#alarm' + this.id;
        if (this.boolAlarma) {
            this.boolAlarma = false;
            $(tag).css('display', 'none');
        } else {
            this.boolAlarma = true;
            $(tag).css('display', 'block');
        }
    }
    this.changeAlarm = function (time) {
        // Antes de nada necesito la función autoRef
        if (!this.actualizar) {
            if (this.boolParada) {
                this.refOn();
            } else {
                return false;
            }
        }
    
        // Comprobar que es un entero
        if (parseInt(time, 10) != time - 0) {
            alert('Introduce sólo números enteros, por favor');
            return false;
        }
        
        // Registrar la activación
        this.alarmOn = true;
        this.alarma = time;
        this.boolAlarm = false;
        
        // Cambiar el nombre de la cabecera colapsable alarma
        var tag = '#cabAlarma' + this.id;
        $(tag).html('ALARMA: ' + this.alarma + ' MINUTOS');
        
        // Colapsar el menú alarma
        tag = '#alarm' + this.id;
        $(tag).css('display','none');
        
        // Cambiar icono
        var tag = '#alarmIcon' + this.id;
        $(tag).attr('src', 'alarmOn.png');
        
    }
    this.eventRef = function () {
        if (this.actualizar) {
            this.actualizar = false;
            var tag = '#refIcon' + this.id;
            $(tag).attr('src', 'refOff.png');
            clearInterval(this.intervalo);
        } else {
            if (this.boolParada) {
                this.refOn();
            }
        }
    }
    this.checkAlarma = function (bus1, bus2) {
        if ( bus1 == this.alarma || bus2 == this.alarma ) { // Viene el bus!
            // Desactivo la alarma
            this.alarmOn = false;
            
            // Cambio el icono
            var tag = '#alarmIcon' + this.id;
            $(tag).attr('src', 'alarmOff.png');
            
            // Oculto el menú alarma
            this.boolAlarma = false;
            tag = '#alarmMenu' + this.id;
            $(tag).css('display', 'none');
            
            // Alerto
            alert('El autobús ' + this.numLinea + ' llega a la parada ' + this.parada + ' en ' + this.alarma + ' minutos');
            
            // Notifico
            /*var notification = webkitNotifications.createNotification(
              'sample-48.jpg', 
              '¡Llega el bus!', 
              'El ' + this.numLinea + ' llega a la parada ' + this.parada + ' en ' + this.alarma + ' minutos' 
            );

            notification.show();*/
        }
    }
    this.refOn = function () {
        this.actualizar = true;
        var tag = '#refIcon' + this.id;
        $(tag).attr('src', 'refOn.png');
        tag = '#tiempo' + this.id;
        var ref = this;
        this.intervalo = setInterval (function () {
                // Cargar tiempo
                $.get("http://www.emtmadrid.es/aplicaciones/Espera.aspx?parada=" + ref.parada + "&linea=" + ref.numLinea, function(data){
                        var tiempos = sacaTiempos($(data).find("#Label3").html());
                        $(tag).html('<td><ul><li><h6>' + tiempos.bus1 + ' minutos</h6></li><br /><li><h6>' + tiempos.bus2 + ' minutos</h6></li><br /></ul></td>');
                        if (ref.alarmOn) ref.checkAlarma(tiempos.bus1, tiempos.bus2);
                    }
                );
            }, 
            5000
        );
    }
    this.eventClose = function () {
        var tag = '#consulta' + this.id;
        $(tag).remove();
        delete consultas[this.id];
    }
    this.printLineas = function () {
        var loadingcode = '<p align="center"><img src="loading.gif" /></p>';
        var tag = '#linea' + this.id;
        $(tag).html('<td>' + loadingcode + '</td>');
        var htmlcode1 = '<td>' +
                            '<select onchange="javascript:consultas[' + this.id + '].changeLinea($(this).children(' + "'" + ':selected' + "'" + '));">';
        var htmlcode2 =     '</select>' +
                        '</td>';
        $.get("http://www.emtmadrid.es/Home.aspx", 
            function(data){
                $(tag).html(htmlcode1 + $(data).find("#ctl00_ContentPlaceHolder1_repeaterTiempoEsperaDerecha_ctl00_ctl00_ComboLineasBloqueTiempoEspera_cbLineas").html() + htmlcode2);
            }
        );
    }
}