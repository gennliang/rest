/**
 * tree
 */
window.$tree = {
    dbKEY: '-REST-',
    treeBox: undefined,
    currentNodeId: undefined,
    tree: undefined,
    db: undefined,

    titleObj: undefined,
    urlObj: undefined,
    paramObj: undefined,
    methodObj: undefined,
    remarkObj: undefined,
    responseObj: undefined,
    encodeObj: undefined,
    contentTypeObj: undefined,

    /**
     * 初始化
     * @param treeBox ztree容器
     * @param titleObj 标题
     * @param urlObj 地址
     * @param paramObj 入参
     * @param methodObj method
     * @param remarkObj 备注
     * @param responseObj 出参
     */
    init: function (treeBox, titleObj, urlObj, paramObj, methodObj, remarkObj, responseObj, encodeObj, contentTypeObj) {

        $tree.treeBox = treeBox;
        $tree.titleObj = titleObj;
        $tree.urlObj = urlObj;
        $tree.paramObj = paramObj;
        $tree.methodObj = methodObj;
        $tree.remarkObj = remarkObj;
        $tree.responseObj = responseObj;
        $tree.encodeObj = encodeObj;
        $tree.contentTypeObj = contentTypeObj;


        //初始化数据库
        var storage = window.localStorage;
        if (!storage) {
            alert('不支持LocalStorage，无法使用历史功能');
            return e.preventDefault();
        }
        $tree.db = storage;

        //监听事件
        $(document).keydown(function (e) {
            // ctrl + s
            if (e.ctrlKey == true && e.keyCode == 83) {
                $tree.save();
                return false; // 截取返回false就不会保存网页了
            }

        });

        //ztree配置
        $tree.setting = {
            view: {
                addHoverDom: this.addHoverDom,
                removeHoverDom: this.removeHoverDom,
                selectedMulti: true,
                fontCss: this.getFontCss
            },
            edit: {
                enable: true,
                showRemoveBtn: true,
                showRenameBtn: true
            },
            data: {
                simpleData: {
                    enable: true
                }
            },
            callback: {
                beforeDrag: this.beforeDrag,
                beforeDrop: this.beforeDrop,
                beforeRemove: this.beforeRemove,
                onRemove: this.onRemove,
                onDblClick: this.onDblClick,
                onRename: this.onRename,
                onDrop: this.onDrop,
                onCollapse: this.onCollapse,
                onExpand: this.onExpand
            }
        };

        this.refreshMenu(); //刷新菜单




    },
    /**
     * 展开
     */
    onExpand: function () {
        $tree.saveMenu();
    },
    /**
     * 折叠
     */
    onCollapse: function (event, treeId, treeNode) {
        $tree.saveMenu();
    },
    /**
     * 
     */
    beforeDrag: function (treeId, treeNodes) {
        for (var i = 0, l = treeNodes.length; i < l; i++) {
            if (treeNodes[i].drag === false) {
                return false;
            }
        }
        return true;
    },
    /**
     * 
     */
    beforeDrop: function (treeId, treeNodes, targetNode, moveType) {
        return targetNode ? targetNode.drop !== false : true;
    },
    /**
     * 拖拽结束
     */
    onDrop: function (event, treeId, treeNodes, targetNode, moveType) {
        $tree.saveMenu();
    },
    /**
     * 重命名
     */
    onRename: function (event, treeId, treeNode, isCancel) {
        var id = $tree.currentNodeId;
        if (id == treeNode.id.toString()) {
            $tree.titleObj.val(treeNode.name);
        }
        $tree.saveMenu();
    },
    /**
     * 滑过事件
     */
    addHoverDom: function (treeId, treeNode) {
        var sObj = $("#" + treeNode.tId + "_span");
        if (treeNode.editNameFlag || $("#addBtn_" + treeNode.tId).length > 0) return;
        //添加按钮
        var addStr = "<span class='button add' id='addBtn_" + treeNode.tId + "' title='新建' onfocus='this.blur();'></span>";
        sObj.after(addStr);
        var addBtn = $("#addBtn_" + treeNode.tId);
        if (addBtn) addBtn.bind("click", function () {
            $tree.tree.addNodes(treeNode, {
                id: new Date().getTime(),
                pId: treeNode.id,
                name: "新菜单",
                searchParam: ""
            });
            $tree.saveMenu(); //保存菜单
            return false;
        });
        //复制按钮
        if (treeNode.isParent) {
            return;
        }
        var copyStr = "<span class='button copy' id='copyBtn_" + treeNode.tId + "' title='复制' onfocus='this.blur();'></span>";
        sObj.after(copyStr);
        var copyBtn = $("#copyBtn_" + treeNode.tId);
        if (copyBtn) copyBtn.bind("click", function () {
            //复制菜单
            var parentNode = treeNode.getParentNode();
            var newId = new Date().getTime().toString();
            var newName = treeNode.name + "_copy";
            $tree.tree.addNodes(parentNode, treeNode.getIndex() + 1, {
                id: newId,
                pId: parentNode ? parentNode.id : null,
                name: newName,
                searchParam: treeNode.searchParam
            });
            $tree.saveMenu(); //保存菜单

            //复制数据
            var data;
            try {
                data = JSON.parse($tree.db.getItem($tree.dbKEY + treeNode.id));
            } catch (e) {}
            if (!!!data) {
                data = {
                    title: newName,
                    url: '',
                    param: '',
                    method: 'GET',
                    encode: 'normal',
                    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                    remark: '',
                    response: ''
                };
            }
            data.title = newName;
            $tree.db.setItem($tree.dbKEY + newId, JSON.stringify(data));

            return false;
        });
    },
    /**
     * 
     */
    removeHoverDom: function (treeId, treeNode) {
        $("#addBtn_" + treeNode.tId).unbind().remove();
        $("#copyBtn_" + treeNode.tId).unbind().remove();
    },
    /**
     * 删除前事件
     */
    beforeRemove: function (treeId, treeNode) {
        $tree.tree.selectNode(treeNode);
        return confirm("确定要删除【 " + treeNode.name + " 】 吗？");
    },
    /**
     * 删除事件
     */
    onRemove: function (event, treeId, treeNode) {
        var nodes = $tree.tree.transformToArray(treeNode);
        var menus = new Array()
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            $tree.db.removeItem($tree.dbKEY + node.id); //删除数据
        }
        $tree.saveMenu();
    },

    /**
     * 搜索字体匹配样式变化
     */
    getFontCss: function (treeId, treeNode) {
        return (!!treeNode.highlight) ? {
            color: "#A60000",
            "font-weight": "bold"
        } : {
            color: "#333",
            "font-weight": "normal"
        };
    },
    /**
     * 双击 获取数据
     */
    onDblClick: function (event, treeId, treeNode, clickFlag) {
        if (treeNode == null || treeNode.isParent) {
            return false;
        }
        $tree.currentNodeId = treeNode.id.toString();
        var data;
        try {
            data = JSON.parse($tree.db.getItem($tree.dbKEY + treeNode.id));
        } catch (e) {}
        if (!!!data) {
            data = {
                title: '',
                url: '',
                param: '',
                method: 'GET',
                encode: 'normal',
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                remark: '',
                response: ''
            };
        }
        $tree.titleObj.val(treeNode.name);
        $tree.urlObj.val(data.url);
        $tree.paramObj.val(data.param);
        $tree.methodObj.val(data.method);
        $tree.encodeObj.val(data.encode || 'normal');
        $tree.contentTypeObj.val(data.contentType || 'application/x-www-form-urlencoded; charset=UTF-8');
        $tree.remarkObj.val(data.remark)
        $tree.responseObj.val(data.response)
    },

    /**
     * 保存数据
     */
    saveData: function () {
        var result = 0;
        var id = $tree.currentNodeId;
        if (id == '' || id == null || id == undefined) {
            alert("请双击选中菜单后填写内容，然后保存！");
            return;
        }
        var node = $tree.tree.getNodeByParam("id", id, null);
        if (node == null) {
            alert("菜单已被删除，不能保存！");
            return;
        }
        var title = $tree.titleObj.val().trim();
        var url = $tree.urlObj.val().trim();
        var param = $tree.paramObj.val().trim();
        var method = $tree.methodObj.val();
        var encode = $tree.encodeObj.val();
        var contentType = $tree.contentTypeObj.val();
        var remark = $tree.remarkObj.val().trim();
        var response = $tree.responseObj.val().trim();
        if (response.length > 5000) { //返回报文超过5000字节，自动截断
            response = response.substr(0, 5000);
        }
        var data = {
            'title': title,
            'url': url,
            'param': param,
            'method': method,
            'encode': encode,
            'contentType': contentType,
            'remark': remark,
            'response': response
        };
        $tree.db.setItem($tree.dbKEY + id, JSON.stringify(data));

        //url作为搜索项
        node.searchParam = url;
        if (title != node.name) {
            node.name = title;
            result = 1; //改标题
        }
        return result;
    },
    /**
     * 保存菜单
     */
    saveMenu: function () {
        var nodes = $tree.tree.transformToArray($tree.tree.getNodes());
        var menus = new Array();
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var menu = {
                id: node.id,
                pId: node.pId,
                name: node.name,
                open: node.open,
                searchParam: node.searchParam
            };
            menus[i] = menu;
        }

        $tree.db.setItem($tree.dbKEY + 'menuList', JSON.stringify(menus));
    },
    /**
     * 刷新菜单
     */
    refreshMenu: function () {
        var data;
        try {
            data = JSON.parse($tree.db.getItem($tree.dbKEY + 'menuList'))
        } catch (e) {}
        if (data == null || data.length == 0) {
            data = [{
                id: 1,
                pId: 0,
                name: "根目录",
                open: true,
                searchParam: ""
            }];
        }

        $tree.tree = $.fn.zTree.init($tree.treeBox, $tree.setting, data);
        $tree.tree.refresh();
    },
    /**
     * 保存
     */
    save: function () {
        var result = $tree.saveData();
        $tree.saveMenu();
        if (result == 1) {
            $tree.refreshMenu();
        }
    }
}