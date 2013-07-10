MagicGalary = {};
(function(magicGalary){
  var result = []; 
  var scale = 1;
  var padding = 0;
  var margin = 0;
  var rebuildCount = 0;
  var rebuildMaxCount = 20;
  /**
   * _padding is parent node padding
   * _margin is image's and parent node gap
   */
  magicGalary.parse = function(dataList, maxWidth, maxHeight, _padding, _margin, rebuild){
    if(!dataList.length){
      return [];
    }
    
    var d1 = +new Date();
    
    scale = maxWidth/maxHeight;
    padding = _padding || padding;
    margin = _margin || margin;
    
    var tree = reBuildStruct(dataList);
    if(!filterStruct(tree)){
      if(rebuild){
        rebuild();
        return;
      } 
    }
    
    parseTree(tree,maxWidth-2*padding,maxHeight-2*padding,_padding,padding,true);
    
    var d2 = +new Date();
    var tmp = result;
    result = [];
    return tmp;
  };
  
  function reBuildStruct(dataList){
    var childSize = 2;
    var tree = [];
    tree.getCotX = getCot;
    var length = dataList.length;
    var size = 1;
    if(length > 2){
      size = Math.round(length/childSize);
    } 
    var newList = [];
    newList.push(dataList.splice(0,size));
    if(size !== length){
      newList.push(dataList);
    }
    //make array list to tree
    for(var i=0;i<newList.length;i++){
      var data = newList[i];
      if(data.length>1){
        data = reBuildStruct(data);
      } else{
        data = data[0];
        data.getCotX = getCot;
      }
      tree.push(data);
    }
    getBlockScale(tree);
    return tree;
  };
  
  function filterStruct(tree){
    var ret =  Math.abs(Math.atan(1/tree.cotX) - Math.atan(1/scale)) < 0.15;
    if(!ret && rebuildCount >= rebuildMaxCount){
      ret = true;
      rebuildCount = 0;
    } else if(ret){
      rebuildCount = 0;
    }
    rebuildCount++;
    return ret;
  };
  
  function getBlockScale(dataList){
    var cot1 = getCot(dataList[0]);
    var tan1 = 1/cot1;
    if(dataList.length>1){
      var cot2 = getCot(dataList[1]);
      var tan2 = 1/cot2;
    }
    cot2 = cot2||0;
    tan2 = tan2||0;
    var hCot = getHTwoBlockCot(cot1,cot2);
    var vCot = getVTwoBlockCot(tan1,tan2);
    var isCot = getIsCot(hCot,vCot);
    if(isCot){
      dataList.isHor = true;
      dataList.cotX = cot1 + cot2;
    } else{
      dataList.isHor = false;
      dataList.cotX = 1/(tan1 + tan2);
    }
  };
  
  function getCot(data){
    if(!data){
      data = this;
    }
    return data.cotX || data.w/data.h;
  };
  
  function getTan(data){
    return 1/getCot(data);
  };
  
  function getHTwoBlockCot(cot1,cot2){
    var cotX = cot1 + cot2;
    return cotX;
  };
  
  function getVTwoBlockCot(tan1,tan2){
    var tanX = tan1 + tan2;
    return 1/tanX;
  };
  
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
  };
  
  function parseTree(tree,width,height,x,y,isRoot){
    var parser;
    if(tree.isHor){
      parser = hParser;
    } else{
      parser = vParser;
    }
    if(isRoot){
      var r = rootParser(tree.getCotX(),width,height,x,y);
      width = r.width, height = r.height, x = r.x, y=r.y;
    }
    if(tree.length>1){
      //not leaf node
      for(var i=0;i<tree.length;i++){
        var _tree = tree[i];
        var r = parser(_tree.getCotX(),width,height,x,y,i);
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
  };
  
  function hParser(cotX,parentWidth,parentHeight,x,y,i){
    var selfWidth = cotX*parentHeight;
    if(i !== 0){
      x += (parentWidth - selfWidth);
    }
    return {width:selfWidth ,height:parentHeight ,x:x ,y:y};
  };
  
  function vParser(cotX,parentWidth,parentHeight,x,y,i){
    var selfHeight = parentWidth/cotX;
    if(i !== 0){
      y += (parentHeight - selfHeight);
    }
    return {width:parentWidth ,height:selfHeight ,x:x ,y:y};
  };
  
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
  };
  
  function buildFinalNode(tree, width, height, x, y){
    width = Math.floor(width-margin) || 1;
    height = Math.floor(height-margin) || 1;
    return {i:tree.i, w:width, h:height, x:x+margin/2, y:y+margin/2};
  };
  
})(MagicGalary);
