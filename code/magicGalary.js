var MagicGalary = {};
(function(poster){
  var result = []; 
  var scale = 1;
  var padding = 0;
  var margin = 0;
  var spliceChildParts = 2;
  poster.ADD = "1";
  poster.REMOVE = "-1";
  poster.REFRESH = "0";
  poster.CHANGE = "2";
  /**
   * _padding is parent node padding
   * _margin is image's and parent node gap
   */
  poster.parse = function(type, dataList, maxWidth, maxHeight, _padding, _margin, rebuild, structure){
    if(!dataList.length){
      return [];
    }
    
    scale = maxWidth/maxHeight;
    padding = _padding || padding;
    margin = _margin || margin;
    structure = structure || [];
    var newStructure = [];
    var d1 = +new Date();
    
    /*adjust parse type to parse data*/
    switch(type){
      case this.ADD :
        structure = [];//clear structure
        break;
      case this.REMOVE :
        structure = [];//clear structure
        break;
      case this.REFRESH :
        structure = [];//clear structure
        break;
      case this.CHANGE :
        break;
      default:
        break;
    }
    
    var tree = reBuildStruct(dataList,structure,newStructure);
    //console.log(tree);
    //if(!filterStruct(tree)){  if(rebuild){ rebuild(); return; }  }
    
    parseTree(tree,maxWidth-2*padding,maxHeight-2*padding,_padding,padding,true);
    
    var d2 = +new Date();
    var tmp = {position:result,structure:newStructure};
    result = [];
    newStructure = [];
    return tmp;
  };
  
  function reBuildStruct(data, struct, newStruct){
    var tree = [];
    if( isArray(data) ){
      //data is an array
      if( data.length > 1 ){
        //data has multi-subdata
        //data need split to two parts
        var subData = splitArray(data, struct, newStruct);
        //parse sub-data parts 
        //till sub-data is object
        //with recursion invoking, make sure newData.length is two
        for( var i=0;i<subData.length;i++ ){
          var subNewStruct = [];
          var subTree = reBuildStruct(subData[i], struct[i]||[], subNewStruct);
          newStruct.push(subNewStruct);
          tree.push(subTree);
        }
      } else{
        //data has only one subdata
        var subNewStruct = [];
        var subTree = reBuildStruct(data[0], struct[0]||[], subNewStruct);
        newStruct.push(subNewStruct);
        tree.push(subTree);
      }
    } else{
      //data is object
      return data;
    }
    getBlockScale( tree, struct, newStruct );
    return tree;
  };
  
  function filterStruct(tree){
    return Math.abs(Math.atan(1/tree.cotX) - Math.atan(1/scale)) < 0.15;
  };
  
  function getBlockScale(data, struct, newStruct){
    var cot1 = getCot(data[0]);
    var tan1 = 1/cot1;
    var cot2 = 0;
    var tan2 = 0;
    if(data.length>1){
      cot2 = getCot(data[1]);
      tan2 = 1/cot2;
    }
    if( !notNull(struct.isHor) ){
      var hCot = getHTwoBlockCot(cot1,cot2);
      var vCot = getVTwoBlockCot(tan1,tan2);
      var isCot = getIsCot(hCot,vCot);
      if(isCot){
        data.isHor = true;
      } else{
        data.isHor = false;
      }
    } else{
      data.isHor = struct.isHor;
    }
    if(data.isHor){
      data.cotX = cot1 + cot2;
    } else{
      data.cotX = 1/(tan1 + tan2);
    }
    newStruct.isHor = data.isHor;
  };
  
  function isArray( obj ){
    return ( obj instanceof Array );
  }
  
  function splitArray( array, struct, newStruct ){
    var newList = [];
    var size = getSpliceSize(array, struct, newStruct);
    newList = array.splice(0,size);
    return [newList, array];
  }
  
  function getSpliceSize( array, struct, newStruct ){
    var size = 0;
    if( struct.size ){
      size = struct.size;
    } else{
      size = Math.round(array.length/spliceChildParts);
    }
    newStruct.size = size;
    return size;
  }
  
  function getCot(data){
    if(!data){
      data = this;
    }
    return data.cotX || data.w/data.h;
  }
  
  function getTan(data){
    return 1/getCot(data);
  }
  
  function getHTwoBlockCot(cot1,cot2){
    var cotX = cot1 + cot2;
    return cotX;
  }
  
  function getVTwoBlockCot(tan1,tan2){
    var tanX = tan1 + tan2;
    return 1/tanX;
  }
  
  function getIsCot(hCot,vCot){
    var h = scale/hCot;
    var v = scale/vCot;
    if(h > 1){
      h = 1/h;
    }
    if(v > 1){
      v = 1/v;
    }
    return Math.abs(1-h) < Math.abs(1-v);
  }
  
  function parseTree(tree,width,height,x,y,isRoot){
    var parser;
    if(tree.isHor){
      parser = hParser;
    } else{
      parser = vParser;
    }
    if(isRoot){
      var r = rootParser(getCot(tree),width,height,x,y);
      width = r.width, height = r.height, x = r.x, y=r.y;
    }
    if(tree.length>1){
      //not leaf node
      for(var i=0;i<tree.length;i++){
        var _tree = tree[i];
        var r = parser(getCot(_tree),width,height,x,y,i);
        parseTree(_tree, r.width, r.height, r.x, r.y);
      }
    } else if(tree.length===1){
      //leaf node (just one node)
      var _tree = tree[0];
      var node = buildFinalNode(_tree, width, height, x, y);
      result.push(node);
    } else{
      //leaf node
      var node = buildFinalNode(tree, width, height, x, y);
      result.push(node);
    }
  }
  
  function hParser(cotX,parentWidth,parentHeight,x,y,i){
    var selfWidth = cotX*parentHeight;
    if(i !== 0){
      x += (parentWidth - selfWidth);
    }
    return {width:selfWidth ,height:parentHeight ,x:x ,y:y};
  }
  
  function vParser(cotX,parentWidth,parentHeight,x,y,i){
    var selfHeight = parentWidth/cotX;
    if(i !== 0){
      y += (parentHeight - selfHeight);
    }
    return {width:parentWidth ,height:selfHeight ,x:x ,y:y};
  }
  
  function rootParser(cotX,width,height,x,y){
    if(cotX<scale){
      //height is bigger than width
      _width = height*cotX;
      _height = height;
      x = Math.round(width - _width)/2;
    } else{
      //widht is bigger or eq height
      _height = width/cotX;
      _width = width;
      y = Math.round(height - _height)/2;
    }
    return {width:_width,height:_height,x:x,y:y};
  }
  
  function buildFinalNode(tree, width, height, x, y){
    width = Math.floor(width-margin) || 1;
    height = Math.floor(height-margin) || 1;
    return {i:tree.i, w:width, h:height, x:x+margin/2, y:y+margin/2};
  }
  
  function notNull(o){
    return (typeof o !== "undefined");
  }
})(MagicGalary);