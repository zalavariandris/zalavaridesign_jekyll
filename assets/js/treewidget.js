class TreeItem{
    constructor(elem){
        this.elem = elem;
        this.parent = undefined;
        this.children = [];
    }

    getParent(){
        var ul = this.elem.parentElement;
        var parent = ul.parentElement
        if(parent.tagName=="LI"){
            return new TreeItem(parent);
        }
        return undefined;
    }

    getChildren(){
        if(this.isLeaf()){
            return [];
        }

        var children = [];

        for(var child of this.elem.children){
            if(child.tagName=="UL"){
                var ul = child;
                for(var li of ul.children){
                    children.push(new TreeItem(li));
                }
            }
        }
        return children;
    }

    isLeaf(){
        for(var child of this.elem.children){
            if(child.tagName=="UL"){
                return false;
            }
        }
        return true;
    }

    isRoot(){
        return this.elem.tagName=="ul";
    }

    expand(){
        for(var child of this.elem.children){
            if(child.tagName=="UL"){
                child.style.classList.add("open");
            }
        }
    }

    collapse(){
        for(var child of this.elem.children){
            if(child.tagName=="UL"){
                child.classList.remove("open");
            }
        }
    }
}

class TreeWidget{
    constructor(ul){
        var self = this;
        this.elem = ul;

        // collapse all
        for(var item of this.getChildren()){
            item.collapse();
        }

        // show selected item
        this.show(this.selected());

        // expand root item when clicked
        for(var elem of ul.children){
            if(elem.tagName=="LI"){
                var item = new TreeItem(elem);
                elem.onclick = function(e){
                    for(var item of self.getChildren()){
                        item.collapse();
                    }
                    var item = new TreeItem(this);
                    item.expand();
                }
            }
        }
    }

    getChildren(){
        var children = [];
        for(var elem of this.elem.children){
            if(elem.tagName=="LI"){
                children.push(new TreeItem(elem));
            }
        }
        return children;
    }

    selected(){
        var elem = this.elem.querySelector(".selected");
        if(!elem){
            return undefined;
        }
        while(elem.tagName!="LI"){
            elem = elem.parentElement;
        }
        return new TreeItem(elem);
    }

    show(item){
        if(item){
            item.getParent().expand();
        }
    }
}