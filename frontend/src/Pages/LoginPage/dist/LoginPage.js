"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var react_1 = require("react");
var axios_1 = require("axios");
var react_router_dom_1 = require("react-router-dom");
var sweetalert2_1 = require("sweetalert2");
var sweetalert2_react_content_1 = require("sweetalert2-react-content");
var Input_1 = require("../../Components/Input/Input");
var Button_1 = require("../../Components/Button/Button");
var Form_1 = require("../../Components/Form/Form");
var Loader_1 = require("../../Components/Loader/Loader");
require("./dist/LoginPage.css");
var getInputValue_1 = require("../../utils/getInputValue");
var isProduction = process.env.REACT_APP_NODE_ENV === 'production';
var protocol = isProduction ? 'https://' : 'http://';
var port = isProduction ? '' : ':8080';
var url = isProduction ? process.env.REACT_APP_NODE_API : 'localhost';
var server = "" + protocol + url + port;
var LoginPage = function () {
    var _a = react_1.useState(false), isLoading = _a[0], setIsLoading = _a[1];
    var _b = react_1.useState(false), checking = _b[0], setChecking = _b[1];
    var _c = react_1.useState(false), toggleShowHide = _c[0], setToggleShowHide = _c[1];
    var _d = react_1.useState(''), inputUsername = _d[0], setInputUsername = _d[1];
    var _e = react_1.useState(''), inputPassword = _e[0], setInputPassword = _e[1];
    var _f = react_1.useState(false), usernameValidatedChecked = _f[0], setUsernameValidatedChecked = _f[1];
    var _g = react_1.useState(false), passwordValidatedChecked = _g[0], setPasswordValidatedChecked = _g[1];
    var navigate = react_router_dom_1.useNavigate();
    var pattern = new RegExp(/\s+|\b^(?:.{1,2})$\b|(?:.{16,})|(?:\W{2,})|\b(\W.*?\W)\b|\b(true|false|null|undefined)\b/gi);
    var resetState = function () {
        setInputUsername('');
        setInputPassword('');
        setChecking(false);
    };
    var handleLogin = function (e) { return __awaiter(void 0, void 0, Promise, function () {
        var button, verified, checkStatus, err_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // disable multiple click button login
                    e.preventDefault();
                    button = e.currentTarget;
                    button.disabled = true; // disable the button to prevent multiple clicks
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    if (inputUsername.length < 3 || inputPassword.length < 3) {
                        resetState();
                        throw Error('Username and Password should be at least 3 characters');
                    }
                    return [4 /*yield*/, axios_1["default"].get(server + "/user/login", {
                            headers: {
                                username: inputUsername,
                                password: inputPassword,
                                access: 'lomwong'
                            },
                            withCredentials: true
                        })];
                case 2:
                    verified = _b.sent();
                    if (!verified.data.valid) return [3 /*break*/, 4];
                    return [4 /*yield*/, axios_1["default"].post(server + "/user/status/check", {}, {
                            headers: {
                                username: inputUsername,
                                access: 'lomwong'
                            },
                            withCredentials: true
                        })];
                case 3:
                    checkStatus = _b.sent();
                    if (checkStatus.data.valid) {
                        window.history.pushState(null, '');
                        // normal status
                        sessionStorage.setItem('username', inputUsername);
                        setTimeout(function () {
                            setIsLoading(true);
                            navigate("lomwong/" + inputUsername + "/lobby");
                        }, 1000);
                    }
                    _b.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_1 = _b.sent();
                    // if you was banned
                    if (err_1.response && err_1.response.data.banned) {
                        sweetalert2_react_content_1["default"](sweetalert2_1["default"]).fire({
                            icon: 'warning',
                            title: err_1.response.data.error,
                            showConfirmButton: true,
                            confirmButtonText: 'Open to Admin',
                            showCloseButton: true,
                            footer: "<a href=\"#\">Why do I have this issue?</a>",
                            showLoaderOnConfirm: true
                        }).then(function (result) { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                if (result.isConfirmed) {
                                    // if issue was opened
                                    if (err_1.response.data.issueStatus) {
                                        resetState();
                                        setIsLoading(true);
                                        setTimeout(function () {
                                            navigate("/disputeresolution/" + err_1.response.data.issue + "/" + inputUsername);
                                        }, 100);
                                    }
                                    else {
                                        sweetalert2_react_content_1["default"](sweetalert2_1["default"]).fire({
                                            title: 'Create topic',
                                            html: "\n                  <input type=\"text\" class=\"swalInput\" id=\"swalTitle\" placeholder=\"Title 25 characters\">\n                  <textarea class=\"swalInput\" id=\"swalDetail\" value='' placeholder=\"Short details 60 characters\"></textarea>\n                ",
                                            showCancelButton: true,
                                            preConfirm: function () {
                                                var title = document.getElementById('swalTitle').value;
                                                var detail = document.getElementById('swalDetail').value;
                                                if (!title || !detail) {
                                                    sweetalert2_1["default"].showValidationMessage('Both fields are required');
                                                }
                                                if (title.length > 25) {
                                                    sweetalert2_1["default"].showValidationMessage('Ttile cannot exceed 25 characters!');
                                                }
                                                if (detail.length > 60) {
                                                    sweetalert2_1["default"].showValidationMessage('Detail cannot exceed 60 characters!');
                                                }
                                                return { title: title, detail: detail };
                                            }
                                        }).then(function (res) { return __awaiter(void 0, void 0, void 0, function () {
                                            var result_1, err_2;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        if (!res.isConfirmed) return [3 /*break*/, 4];
                                                        _a.label = 1;
                                                    case 1:
                                                        _a.trys.push([1, 3, , 4]);
                                                        return [4 /*yield*/, axios_1["default"].post(server + "/disputeResolution/open", {
                                                                title: res.value.title,
                                                                detail: res.value.detail
                                                            }, {
                                                                headers: {
                                                                    username: inputUsername,
                                                                    code: err_1.response.data.issue
                                                                },
                                                                withCredentials: true
                                                            })];
                                                    case 2:
                                                        result_1 = _a.sent();
                                                        if (result_1.data.valid) {
                                                            navigate("/disputeresolution/" + err_1.response.data.issue + "/" + inputUsername);
                                                        }
                                                        return [3 /*break*/, 4];
                                                    case 3:
                                                        err_2 = _a.sent();
                                                        console.error(err_2.response.data.error);
                                                        return [3 /*break*/, 4];
                                                    case 4: return [2 /*return*/];
                                                }
                                            });
                                        }); });
                                    }
                                }
                                button.disabled = false;
                                return [2 /*return*/];
                            });
                        }); });
                    }
                    else {
                        sweetalert2_react_content_1["default"](sweetalert2_1["default"]).fire({
                            icon: 'error',
                            title: err_1.response ? err_1.response.data.error : (_a = err_1.message) !== null && _a !== void 0 ? _a : 'Authentication is error',
                            showCloseButton: true
                        });
                    }
                    // reset all state
                    setIsLoading(false);
                    resetState();
                    button.disabled = false;
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleRegistration = function (e) { return __awaiter(void 0, void 0, Promise, function () {
        var button;
        return __generator(this, function (_a) {
            // disable multiple click button registration
            e.preventDefault();
            button = e.currentTarget;
            button.disabled = true; // disable the button to prevent multiple clicks
            if (pattern.test(inputUsername) || /\s+/g.test(inputPassword)) {
                sweetalert2_react_content_1["default"](sweetalert2_1["default"]).fire('Username or Password is wrong condition');
                resetState();
                pattern.lastIndex = 0;
            }
            else {
                sweetalert2_react_content_1["default"](sweetalert2_1["default"]).fire({
                    title: React.createElement("i", null, "Need to join ?"),
                    showConfirmButton: true,
                    showCancelButton: true
                })
                    .then(function (result) { return __awaiter(void 0, void 0, void 0, function () {
                    var error_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!result.isConfirmed) return [3 /*break*/, 5];
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, axios_1["default"].post(server + "/user/regisUsers", { username: inputUsername, password: inputPassword }, { withCredentials: true })
                                        .then(function (res) {
                                        sweetalert2_react_content_1["default"](sweetalert2_1["default"]).fire({
                                            title: 'Registration completed',
                                            text: "log-in again with username " + res.data.user,
                                            timerProgressBar: true,
                                            timer: 2000,
                                            showConfirmButton: true
                                        });
                                        resetState();
                                    })["catch"](function (err) {
                                        var _a;
                                        sweetalert2_react_content_1["default"](sweetalert2_1["default"]).fire({
                                            title: 'Registration Error try again',
                                            text: (_a = err.messagge) !== null && _a !== void 0 ? _a : err.response.data.error
                                        });
                                        resetState();
                                    })];
                            case 2:
                                _a.sent();
                                return [3 /*break*/, 4];
                            case 3:
                                error_1 = _a.sent();
                                console.error('Error:', error_1);
                                return [3 /*break*/, 4];
                            case 4: return [3 /*break*/, 6];
                            case 5:
                                resetState();
                                _a.label = 6;
                            case 6: return [2 /*return*/];
                        }
                    });
                }); });
            }
            button.disabled = false;
            return [2 /*return*/];
        });
    }); };
    react_1.useEffect(function () {
        var getSession = function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios_1["default"].get(server + "/general/session", { withCredentials: true })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        getSession();
        return function () {
            console.log('Session had set');
        };
    }, []);
    react_1.useEffect(function () {
        if (inputUsername.length >= 3) {
            setUsernameValidatedChecked(true);
        }
        else {
            setUsernameValidatedChecked(false);
        }
        if (inputPassword.length >= 3) {
            setPasswordValidatedChecked(true);
        }
        else {
            setPasswordValidatedChecked(false);
        }
    }, [inputUsername, inputPassword]);
    return (React.createElement(React.Fragment, null, isLoading ?
        React.createElement(Loader_1["default"], null)
        :
            React.createElement("div", { id: 'loginPageBody', className: 'd-flex justify-content-center align-items-center w-100' }, React.createElement(Form_1["default"], { action: '#', method: 'POST', className: 'form p-15 p-md-20', id: 'loginForm', head: 'LomWongChat', headClass: 'titleHead', subHead: 'Keep the chat on fire!', subHeadClass: 'subHead', target: '_self', autoComplete: 'on' },
                React.createElement("div", { className: 'inputWrapper' },
                    React.createElement(Input_1["default"], { onChange: function (e) { return getInputValue_1.getInputValue(e, setInputUsername, 15); }, type: 'text', name: 'inpUsername', value: inputUsername || '', min: '3', max: '15', id: 'inpUsername', className: 'inp inpUsername posRe', placeHolder: '', useLabel: true, labelText: 'Username', labelId: 'labelUsername', labelClass: 'labelUsername', required: true }),
                    usernameValidatedChecked ?
                        React.createElement("i", { className: 'fa fa-check-circle validatedChecked' })
                        :
                            React.createElement(React.Fragment, null)),
                React.createElement("div", { className: 'inputWrapper' },
                    React.createElement(Input_1["default"], { onChange: function (e) { return getInputValue_1.getInputValue(e, setInputPassword, 20); }, type: toggleShowHide ? 'text' : 'password', name: 'inpPassword', value: inputPassword || '', id: 'inpPassword', className: 'inp inpPassword', placeHolder: '', useLabel: true, labelText: 'Password', labelId: 'labelPassword', labelClass: 'labelPassword', useShowHide: [true, setToggleShowHide], required: true }),
                    passwordValidatedChecked ?
                        React.createElement("i", { className: 'fa fa-check-circle passValidatedChecked' })
                        :
                            React.createElement(React.Fragment, null)),
                React.createElement("div", { className: 'buttonWrapper d-block' }, React.createElement(React.Fragment, null, checking ?
                    React.createElement(Button_1["default"], { type: 'button', name: 'checking', id: 'checkingBtn', className: 'btn checkingBtn formBtn mb-10 mb-md-0', innerText: 'checking', disabled: true })
                    :
                        React.createElement(React.Fragment, null,
                            React.createElement(Button_1["default"], { onClick: handleLogin, type: 'button', name: 'login', id: 'loginBtn', className: 'btn loginBtn formBtn mb-10 mb-md-0', innerText: 'Login' }),
                            React.createElement(Button_1["default"], { onClick: handleRegistration, type: 'button', name: 'regis', id: 'regisBtn', className: 'btn regisBtn formBtn mb-10 mb-md-0', innerText: 'Not a member ? Register Now' }))))))));
};
exports["default"] = LoginPage;
