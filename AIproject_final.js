
var ownData = undefined; 
var openlist=[]; //ebben vannak a vizsgálandó node-ok (type: Node class)
var allnodes=[]; //ebben van az összes kibontott node, hogy vissza lehessen keresni benne a parent-eket (pointeres láncolás helyett) (type: Node class)
var result_moves=[]; //ebben vannak a célba vezető irányok/lépések
var id=0; // ez azonosítja a node-ot, egy node-hoz tartozhat több azonosító is, mivel többféleképpen is el lehet jutni oda
var counter=0; //számláló,hogy hányszor fut le az A* while-ja
var finishcoord=[]; //a célhalmaz (type: BFSNode class)

var actscope=[]; //ebben vannak azok a koordináták amiket aktuálisan lát (type: BFSNode class)
var connection_parent; //amikor újraépítem a gráfot, akkor ez lesz a kezdeti pont
var BFSopenlist=[]; //actscope felderítéséhez használt BFS-nél az aktuálisan vizsgálandó Node-ok  (type: BFSNode)


class BFSNode { //a BFS során a node típusa
    constructor(act,pcoord,deep) {

        this.actcoord=act; //actual coord {x: ,y: }
        this.parentcoord=pcoord; //parent's coord {x: y: }
        this.deep=deep; //route length, from start to this
    }

}

class Node { //az A* során használt node típusa
    constructor(id,act,parent,parentcoord,cost,move,sumsteps,heuristic) {
        this.id=id; 
        this.actcoord=act; //{x: ,y: } JS object
        this.parent_id=parent; 
        this.parentcoord=parentcoord; 
        this.cost=cost; // speed
        this.move=move; //{x: ,y: } JS object, azt a lépést tárolja, amellyel odakerült
        this.sumsteps=sumsteps //ennyi lépés kellett, hogy eljusson ehhez a node-hoz
        this.heuristic=heuristic //the heuristic value of the actual node (légvonalbeli táv a célhalmaz 1. elemére)
        this.f=sumsteps+heuristic //the f() value, of the node
    }

}


this.init = function(c, playerdata, selfindex){ //c->pályatömb, player és selfindex-ből az aktuális pozíció határozható meg
    console.log('hello, world');

    
}

this.movefunction = function(c, playerdata, selfindex) {


    console.log("-----------------------------------------------");
    
    //minden egyes körben újraépítem a gráfot
    Astar(c,playerdata,selfindex) 

    //a célhoz vezető út első lépése
    return result_moves.shift();


}

function Astar(c,playerdata,selfindex) { //A* keresés az optimális célbajutás lépéseinek meghatározására
    
    openlist=[];
    var self = playerdata[selfindex]; //start pozíció koordinátái


    var from;
    if (connection_parent) { //ha ez nem a legelső kör, akkor egy connection_parent-et használok, hogy a gráf újraépítésénél a kezdőpont az előző kör utolsó node-ja legyen

        connection_parent.id=0;
        connection_parent.heuristic=0;
        openlist.unshift(connection_parent); //kibontom az első node-ot

        from=wayfrom(connection_parent.actcoord.x,connection_parent.actcoord.y,connection_parent.parentcoord.x,connection_parent.parentcoord.y) //meghatározza, hogy honnan jön
    }
    else { //ha ez az első kör, akkor az első node a start pozíció lesz
        openlist.unshift(new Node(id,{x: self.pos.x,y: self.pos.y},-1,{x: self.pos.x,y: self.pos.y},0, {X: -50,y: -50},0,0)); //add start pos to openlist
        from="zero";
    }


    BFSdiscover(c,playerdata,selfindex,from); //BFS-el meghatározni a pontokat,amiket látunk
    getGoals(c); //meghatározni az aktuális célt/célokat
    console.log("Aktscope: ",actscope);
    console.log('finish: ',finishcoord);
 
    var goal=false;
    var finish; 
    var last; //in case of empty openlist
    while(!goal) { //amíg nem találtunk célmezőt, addig keresünk
        console.log("length:  "+openlist.length);
        if(openlist.length>400 || openlist.length===0) { //ha már túl sokáig nem talál megoldást, vagy zsákutcába jutott, akkor brute force kilép
            console.log("OPENLIST ERROR")
            result_moves=[];
            return null;
        }

        var investigated=openlist.shift(); //get the first from openlist (kibontjuk a lista első node-ját)
        
      
        
        allnodes.push(investigated); //hozzáadjuk az allnodes-hoz, hogy ha esetleg a nyertes út tartalmazza ezt a node-ot, akkor meglegyen
        var templist=[] //ez a lista arra van, hogy ebbe tegyük az investigate-ből  felfedezett elemeket,amiket beleteszek az openlist-be

        for (let i = -1; i <= 1; i++) { //végigmegyünk a lépés opciókon
            for (let j = -1; j <= 1; j++) {
                
                var newstep = { // thats how the center of the next movement can be computed
                    x: investigated.actcoord.x+(investigated.actcoord.x-investigated.parentcoord.x)+i,
                    y: investigated.actcoord.y+(investigated.actcoord.y-investigated.parentcoord.y)+j
                };
                var cost=Math.sqrt(Math.pow(newstep.x-investigated.actcoord.x,2)+Math.pow(newstep.y-investigated.actcoord.y,2)) //calculate the cost with Pythagoras 

                 if(cost>=2.5) continue; //bizonyos sebesség felett ignorálom a lépést
                    
                if (lc.playerAt(newstep)!=-1) continue;
                if(newstep.x===investigated.actcoord.x && newstep.y===investigated.actcoord.y) { //ha a felfedezett ugyanaz, mint ahonnan jött(investigated),akkor skip
                   
                    continue;
                }

                if(!contains_class(actscope,newstep)){ //ha a felfedezett node nincs benne a látótávban->skip
                   
                    continue;
                } 

                if(newstep.x>=c.length || newstep.y>=c[0].length || newstep.x<0 ||newstep.y<0) { //border ellenőrzése, hogy ne lépjen ki a tömbből
                  
                    continue; 
                } 
                
                //ha kilépne a látótávolságból, vagy falba ütközne, vagy az investigated és a felfedezett pont között nincs helyes út(falba ütközik a lépés során)
                if(c[newstep.x][newstep.y]===undefined || c[newstep.x][newstep.y]<0 || !lc.validVisibleLine(c,investigated.actcoord,newstep)) { 
                  
                    continue;
                    
                } 

                var sumsteps=investigated.sumsteps+1; //a felfedezett node-hoz ennyi lépés kellett
                var heuristic=Math.sqrt(Math.pow(newstep.x-finishcoord[0].actcoord.x,2)+Math.pow(newstep.y-finishcoord[0].actcoord.y,2)); //a felfedezett elemtől légvonalban a cél 1.eleméig

                if (contains_class(finishcoord,newstep)  ) { //ha célt találtunk
                
                    finish=new Node(++id,newstep,investigated.id,investigated.actcoord,cost,{x:i,y:j},sumsteps,heuristic); //elmentjük a finisht 
                    goal=true; //hogy kiléphessünk a ciklusból
                    break;
                } 
                else {
                  
                    templist.push(new Node(++id,newstep,investigated.id,investigated.actcoord,cost,{x:i,y:j},sumsteps,heuristic)); 
                }
            }
            if(goal) break;
        }
        if(goal) break;


        for (let i = 0; i < templist.length; i++) { //végignézem, hogy ha talált jobb utat egy node-ba, akkor a rosszabbikat vegye ki az openlist-ből, vagy az allnodes-ból
            var temp_open_del=false;
            var temp_all_del=false;
             
            for (let j = 0; j < openlist.length; j++) { 

                if(JSON.stringify(templist[i].actcoord)===JSON.stringify(openlist[j].actcoord)) { //ha egy node-ra több út vezet,akkor...
                   
                    if(templist[i].f>openlist[j].f) { //ha felfedezettnek kisebb az f-je, akkor...
                      
                        openlist.splice(j,1); //kitöröljük az openlistből ami a rosszabb
                    } else { //ha pedig a felfedezett rosszabb, egyszerűen eldobjuk majd
                      
                       temp_open_del=true;
                    }
                } 
            }
            
            for (let j = 0; j < allnodes.length; j++) { //ha pedig amit talált az rosszabb, akkor 
                if(JSON.stringify(templist[i].actcoord)===JSON.stringify(allnodes[j].actcoord)) { //ha egy node-ra több út vezet,akkor...
              
                    if(templist[i].f<allnodes[j].f) { //ha felfedezettnek kisebb az f-je, akkor...
                       
                        allnodes.splice(j,1); //kitöröljük az allnodesból ami a rosszabb
                    } else { //ha pedig a felfedezett rosszabb, egyszerűen eldobjuk  majd
                      
                        temp_all_del=true;

                    }
                } 
            }
            
            //itt dobom el
            if(temp_open_del) { 
                templist.splice(i,1);
                continue;
            }
            
            if(temp_all_del) {
                templist.splice(i,1);
                continue;
            }

        }
        
        for (let i = 0; i < templist.length; i++) { //a felfedezett elemeket beletöltöm az openlistbe
            openlist.push(templist[i]);
        }
        openlist.sort(compare); //sorba rendezem az f szerint a vizsgálandó elemeket növekvőbe

        if (openlist.length===1) { //ez arra van, ha valami miatt nem találna célt, és kiürülne az openlist, akkor is térjen vissza egy lépéssel
            last=openlist[0]; 
               
        }
        if (openlist.length===0) {
            finish=last;
            goal=true;
        }
        if(goal) break;

        
    }
    if (goal) { //ha megvan a cél, akkor onnan visszafele elmentem, hogy miket lépett
        result_moves=[];
        if(!finish) {
            console.log("Üres finish hiba!")
            return;
        }

        var is_start=false; 
        var actnode=finish; 

        while(!is_start) {

            if(actnode.id===0) { //ha elértünk a startba, akkor nem kell tovább keresni
                is_start=true;
            } else {
                result_moves.unshift(actnode.move); //a result_moves elejébe tesszük az aktuális lépést
                connection_parent=actnode;
                actnode=getParentfromAllnodes(actnode); //az aktuális az lesz, ami a parentje

            }
        }
        
    }
    console.log("Sikeres Astar!");

}

function compare(a, b) { //f szerint növekvő sorrend
    if (a.f < b.f) return -1;
    if (a.f > b.f) return 1;
  
    return 0;
}



function getParentfromAllnodes(actnode) { //meghatározza az adott node parent-jét
    for (let i = 0; i < allnodes.length; i++) {
        if(actnode.parent_id===allnodes[i].id) return allnodes[i];
    }
    console.log("no parent found");
    return false;
    
}

function BFSdiscover(c,playerdata,selfindex,from) { //BFS keresés, hogy feltérképezze, hogy miket lát->actscope
    actscope=[];
    BFSopenlist=[];
    var self = playerdata[selfindex]; //start pozíció


    BFSopenlist.unshift(new BFSNode({x: self.pos.x,y: self.pos.y},{x: self.pos.x,y: self.pos.y},0)); //add start pos to BFSopenlist



 
    var goal=false;
    while(BFSopenlist.length>0) { //amíg van mit nézni addig megyünk
        var investigated=BFSopenlist.shift(); //get the first from BFSopenlist (kibontjuk a lista első node-ját)

        actscope.push(investigated); //hozzáadjuk az actscope-hoz
        var templist=[] //ez a lista arra van, hogy ebbe tegyük a felfedezett elemeket,amiket aztán beletöltünk a BFSopenlist-be

        var min_i=-1;
        var max_i=1;
        var min_j=-1;
        var max_j=1;
        var exclude=[];
        
        //megnézem, hogy honnan jön, és aszerint korlátozom a lépésopciókat
        switch(from) {
            case "up":
                min_i=0;
                break;
            case "down":
                max_i=0;
                break;
            case "left":
                min_j=0;
                break;
            case "right":
                max_j=0;
                break;
            case "upright":
                exclude.push({x:-1,y:0});
                exclude.push({x:-1,y:1});
                exclude.push({x:0,y:1});
                break;
            case "upleft":
                exclude.push({x:-1,y:-1});
                exclude.push({x:-1,y:0});
                exclude.push({x:0,y:-1});
                break;
            case "downleft":
                exclude.push({x:1,y:-1});
                exclude.push({x:1,y:0});
                exclude.push({x:0,y:-1});
                break;
            case "downright":
                exclude.push({x:1,y:1});
                exclude.push({x:1,y:0});
                exclude.push({x:0,y:1});
                break;
        }
        

        for (let i = min_i; i <= max_i; i++) { //végigmegyünk a szomszédokon
            for (let j = min_j; j <= max_j; j++) {
                if (contains_coord(exclude,{x:i,y:j})) continue;

                var newstep = { //a szomszéd koordinátája
                    x: investigated.actcoord.x+i,
                    y: investigated.actcoord.y+j
                };
                
                
                if(newstep.x===investigated.actcoord.x && newstep.y===investigated.actcoord.y) continue; //ha ugyanaz a pont->skip

                if(contains_class(actscope,newstep) || contains_class(BFSopenlist,newstep)) {

                    continue; //ha a vizsgált elem már benne a scope-ban akkor továbblépünk
                }

                if(newstep.x>=c.length || newstep.y>=c[0].length || newstep.x<0 ||newstep.y<0) continue; //border ellenőrzése, hogy ne lépjen a tömbön kívülre

                if(c[newstep.x][newstep.y]===undefined || c[newstep.x][newstep.y]<0 ) continue; //ha az adott lépés kilépne a látókörből(undefined), vagy falba ütközne, akkor azt nem veszi számításba, továbblép

                templist.push(new BFSNode(newstep,investigated.actcoord,investigated.deep+1)); //hozzáadom a templisthez

            }

        }

        for (let i = 0; i < templist.length; i++) { //a felfedezett elemeket beletöltöm az BFSopenlistbe
            BFSopenlist.push(templist[i]);
        }

        
    }

    console.log("Discovery lefuttatva");

}

function getGoals(c) { //ezzel keresem meg az actscope-ban a célt
    var partGoal=[]; //részcél, ha még nem látja a valódit
    var originalGoal=[]; //igazi cél
    actscope.sort(compare_deep); //deep szerint csökkenőbe rendezem az actscope-ot, vagy a legmélyebb elem lesz legelől
    for (let i = 0; i < actscope.length; i++) {
        if (c[actscope[i].actcoord.x][actscope[i].actcoord.y]=== 100) originalGoal.push(actscope[i]); //ha igazi célt talál
    }
    if (originalGoal.length>0) finishcoord=originalGoal; //ha talált igazi célt, akkor nem kell megnézni a részcélokat
    else { //ha mégsem, akkor viszont részcélt kell keresni
        //az a koncepció, hogy a legtávolabbi elem(ek) a kezdőponttól az actscope-ban a részcél(ok)
        var maxdeep=actscope[0].deep; //ez a legmélyebb
        for (let i = 0; i < actscope.length; i++) {
            if (actscope[i].deep===maxdeep) partGoal.push(actscope[i]);
        }
        finishcoord=partGoal;
    }
}


function contains_class(array, object) { //an array of Node or BFSNode contains a {x:,y:} object?
    for (let i = 0; i < array.length; i++) { //itt azt ellenőrzöm, hogy egy array of objectben van-e már ezzel a {x: ,y: } object-el megegyező elem
        if (array[i].actcoord.x===object.x && array[i].actcoord.y===object.y) return true;
    }
    return false;
}

function contains_coord(array, coord) { //an array of {x:,y:} contains a {x:,y:} object?
    for (let i = 0; i < array.length; i++) {
        if (array[i].x===coord.x && array[i].y===coord.y) return true;
    }
    return false;
}

function compare_deep(a, b) {  //segédfüggvény sort-hoz: mélység szerint csökkenőbe 
    if (a.deep < b.deep) return 1;
    if (a.deep > b.deep) return -1;
  
    return 0;
}

function wayfrom(newx,newy, posx,posy) { //két pont között meghatározom, hogy milyen irányban vannak egymással 

    
    if (newx>posx && newy===posy) return 'up';
    if (newx<posx && newy===posy)   return 'down';
    if (newx===posx && newy>posy)   return 'left';
    if (newx===posx && newy<posy)  return 'right';
    if (newx>posx && newy<posy)  return 'upright';
    if (newx>posx && newy>posy)  return 'upleft';
    if (newx<posx && newy<posy)  return 'downright';
    if (newx<posx && newy>posy)  return 'downleft';
    if (newx===posx && newy===posy) return 'zero';
}
