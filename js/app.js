$(function () {
    var db = window.localStorage;
    //清空
    $('#btn_empty').click(function () {
        $('#v_r').val('');
    });
    //BASE64编码
    $('#btn_be').click(function () {
        $("#v_r").val(base64Encode($("#v_r").val()));
    });
    // BASE64解码
    $('#btn_bd').click(function () {
        $("#v_r").val(base64Decode($("#v_r").val()));
    });
    // JSON格式化
    $('#btn_jf').click(function () {
        $("#v_r").val(formatJson($("#v_r").val()));
    });
    // JSON格式化入参
    $('#btn_format_params').click(function () {
        $("#v_q").val(formatJson($("#v_q").val()));
    });

    // JSON VIEW
    $('#modal_json_view').on('show.bs.modal', function (e) {
        $("#modal_json_view .modal-body .json_view").JSONView($('#v_r').val(), {
            collapsed: false
        });
    });

    // 展开全部
    $('#btn_open_all').click(function () {
        $tree.tree.expandAll(true);
        $tree.saveMenu();
    });
    // 折叠全部
    $('#btn_close_all').click(function () {
        $tree.tree.expandAll(false);
        $tree.saveMenu();
    });

    // 保存
    $('#btn_save').click(function () {
        $tree.save();
    });

    //搜索
    $("#input-search").bind("propertychange", searchNode);
    $("#input-search").bind("input", searchNode);

    var lastValue = "";
    var nodeList = [];

    function searchNode() {
        updateNodesFont(nodeList, false);
        var txt = $("#input-search").val();
        if (txt == '' || txt == null) return;
        lastValue = txt;
        var nodeList1 = $tree.tree.getNodesByParamFuzzy('name', txt);
        var nodeList2 = $tree.tree.getNodesByParamFuzzy('searchParam', txt);
        nodeList = nodeList1.concat(nodeList2);
        updateNodesFont(nodeList, true);
    }

    function updateNodesFont(nodeList, highlight) {
        for (var i = 0, l = nodeList.length; i < l; i++) {
            nodeList[i].highlight = highlight;
            $tree.tree.updateNode(nodeList[i]);
        }
    }

    // 提交
    $('#btn_send').click(function () {
        $('#span_wait').show();
        var type = $("#r_req_type").val();
        var contentType = $("#r_req_c_type").val();
        var base64 = (type == 'base64');
        var method = $('#sel_method').val();
        var url = $('#t_req_url').val();
        var orgRequestBody = $('#v_q').val();
        var requestBody = base64 ? base64Encode(orgRequestBody) : orgRequestBody;
        $.ajax({
            type: method,
            url: url,
            data: requestBody,
            dataType: 'text',
            contentType: contentType,
            success: function (result) {
                try {
                    var z = base64 ? base64Decode(result) : result;
                    try {
                        z = formatJson(z);
                    } catch (e) {
                        console.log(e);
                    }
                    $('#v_r').val(z);
                } catch (e) {
                    var z = "####处理返回失败：[ " + e + " ]";
                    $('#v_r').val(z);
                }
                saveHis(url, method, orgRequestBody, type, contentType);
            },
            error: function (t, e, z) {
                var z = "####请求出错： [ " + e + " ] \n";
                z += JSON.stringify(t, null, 2);
                $('#v_r').val(z);
            },
            complete: function () {
                $('#span_wait').hide();
            }
        });
    });

    function formatJson(v) {
        var t = JSON.parse(v);
        return JSON.stringify(t, null, 2);
    }

    function base64Encode(v) {
        var str = CryptoJS.enc.Utf8.parse(v);
        return CryptoJS.enc.Base64.stringify(str);
    }

    function base64Decode(v) {
        var words = CryptoJS.enc.Base64.parse(v);
        return words.toString(CryptoJS.enc.Utf8);
    }


    // 保存历史
    function saveHis(url, method, requestBody, type, contentType) {
        var storage = window.localStorage;
        if (storage) {
            var his = loadFromStorage(storage);
            var obj = {};
            obj.url = url;
            obj.method = method;
            obj.requestBody = requestBody;
            obj.type = type;
            obj.contentType = contentType;
            putHis(his, obj);
            saveToStorage(storage, his);
        }
    }

    function loadFromStorage(storage) {
        var hisStr = storage.getItem("request_history");
        if (hisStr == null || hisStr == '') {
            hisStr = '[]';
        }
        return eval('(' + hisStr + ')');
    }

    function saveToStorage(storage, arr) {
        storage.setItem("request_history", JSON.stringify(arr));
    }

    function putHis(arr, obj) {
        var find = false;
        for (var i = 0; i < arr.length; i++) {
            var existObj = arr[i];
            if (existObj.url == obj.url) {
                arr[i] = obj;
                find = true;
            }
        }
        if (!find) {
            arr.push(obj);
        }
    }

    function removeHis(arr, url) {
        for (var i = 0; i < arr.length; i++) {
            var existObj = arr[i];
            if (existObj.url == url) {
                arr.splice(i, 1);
                break;
            }
        }
    }


    function selHis(obj) {
        $('#sel_method').val(obj.method);
        $('#t_req_url').val(obj.url);
        $('#v_q').val(obj.requestBody);
        $("input[name='r_req_type'][value='" + obj.type + "']").attr('checked', 'checked');
        $("input[name='r_req_c_type'][value='" + obj.contentType + "']").attr('checked', 'checked');
    }


    // HISTORY MANAGE
    var TABLE_EXIST = false;
    $('#modal_history').on('show.bs.modal', function (e) {
        var storage = window.localStorage;
        if (!storage) {
            alert('不支持LocalStorage，无法使用历史功能');
            return e.preventDefault();
        }

        var arr = loadFromStorage(storage);

        if (!TABLE_EXIST) {
            TABLE_EXIST = true;
            $('#modal_history .modal-body table').bootstrapTable({
                classes: 'table table-hover',
                showRefresh: true,
                showToggle: true,
                showPaginationSwitch: true,
                height: 400,
                columns: [{
                    field: 'url',
                    title: '请求地址',
                    sortable: true,
                }, {
                    field: 'method',
                    title: '请求方法'
                }, {
                    field: 'type',
                    title: '请求类型',
                    sortable: true,
                }, {
                    field: 'operate',
                    title: '操作',
                    align: 'center',
                    events: operateEvents,
                    formatter: operateFormatter
                }],
                data: arr,
                striped: true,
                pagination: true,
                pageNumber: 1,
                pageSize: 10,
                pageList: [10, 25, 50, 100],
                search: true,
                detailView: true,
                detailFormatter: function (index, row) {
                    return row.requestBody;
                },

                onDblClickRow: function (row, elm) {
                    selHis(row);
                    $('#modal_history').modal('hide');
                }
            });
        } else {
            $('#modal_history .modal-body table').bootstrapTable('load', arr);
        }

    })

    function operateFormatter(value, row, index) {
        return [
            '<a class="remove" href="javascript:void(0)" title="Remove">',
            '<i class="glyphicon glyphicon-trash"></i>',
            '</a>'
        ].join('');
    }

    window.operateEvents = {
        'click .remove': function (e, value, row, index) {
            $('#modal_history .modal-body table').bootstrapTable('remove', {
                field: 'url',
                values: [row.url]
            });
            var storage = window.localStorage;
            var his = loadFromStorage(storage);
            removeHis(his, row.url);
            saveToStorage(storage, his);
        }
    };


    //树
    $tree.init($("#treeBox"), $("#title"), $("#t_req_url"), $("#v_q"), $("#sel_method"), $("#remark"), $("#v_r"), $("#r_req_type"), $("#r_req_c_type"));

    //导出
    $('#exportBtn').click(function () {
        exportData();
    });
    //导出文本
    $('#exportTextBtn').click(function () {
        exportDataText();
    });
    //导入文本
    $('#inportTextBtn').click(function () {
        inportDataText();
    });

    //自动导出
    var currentTime = Date.parse(new Date());
    var lastBackupTime = db.getItem('lastBackupTime');
    if (!!lastBackupTime) {
        if (currentTime - lastBackupTime > 86400000) {
            exportData();
            db.setItem('lastBackupTime', currentTime);
        }
    } else {
        db.setItem('lastBackupTime', currentTime);
    }


    /**
     * 导出
     */
    function exportData() {
        var arr = new Array();
        for (var i = 0; i < db.length; i++) {
            arr.push({
                key: db.key(i),
                value: db.getItem(db.key(i))
            });
        }
        //下载
        o = new Blob([JSON.stringify(arr)]),
            t = document.createElement("a");
        t.href = window.URL.createObjectURL(o),
            t.download = "JsonToolBackup-" + (new Date().format('yyyyMMddhhmmss')) + ".json",
            t.click(),
            $(t).remove()
    }
    
    

    /**
     * 导出Text
     */
    function exportDataText() {
        $('#exportTextResult').text('');
        var arr = new Array();
        for (var i = 0; i < db.length; i++) {
            arr.push({
                key: db.key(i),
                value: db.getItem(db.key(i))
            });
        }
        //下载
        $('#exportTextResult').text(JSON.stringify(arr));
    }
    
    
    /**
     * 导入Text
     */
    function inportDataText() {
        var txt=$('#inportTextResult').val();
        if(!!!txt){
            alert("数据不能为空");
            return ;
        }
        parseData(txt);
    }

    //导入文件
    $("#dataRestore").click(function (t) {
        $(this).val("")
    });
    $("#dataRestore")[0].onchange = function () {
        var t = this.files[0],
            e = new FileReader;
        e.readAsText(t),
            e.type = "text",
            e.onload = function () {
                var param = e.result;
                parseData(param);

            }
    }

    /**
     * 解析数据
     */
    function parseData(param) {
        if (param == '') {
            alert('请输入数据！');
            return;
        }
        var data = JSON.parse(param);

        //清空原数据
        db.clear();

        //数据兼容
        if (param.indexOf('-menuList') != -1) { //新数据
            //导入
            for (var i = 0; i < data.length; i++) {
                db.setItem(data[i].key, data[i].value);
            }
        }

        alert('导入成功！');
        location.reload();

    }

});