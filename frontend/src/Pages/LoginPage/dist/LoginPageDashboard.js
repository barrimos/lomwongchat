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
var react_router_dom_1 = require("react-router-dom");
var Switch_1 = require("../../Components/Switch/Switch");
var Form_1 = require("../../Components/Form/Form");
var Input_1 = require("../../Components/Input/Input");
var Button_1 = require("../../Components/Button/Button");
var getInputValue_1 = require("../../utils/getInputValue");
var axios_1 = require("axios");
var sweetalert2_react_content_1 = require("sweetalert2-react-content");
var sweetalert2_1 = require("sweetalert2");
require("./dist/LoginPageDashboard.css");
var isProduction = process.env.REACT_APP_NODE_ENV === 'production';
var protocol = isProduction ? 'https://' : 'http://';
var port = isProduction ? '' : ':8080';
var url = isProduction ? process.env.REACT_APP_NODE_API : 'localhost';
var server = "" + protocol + url + port;
var LoginPageDashboard = function () {
    var navigate = react_router_dom_1.useNavigate();
    var initialRef = react_1.useRef(false);
    var _a = react_1.useState(''), inpSysUsername = _a[0], setInpSysUsername = _a[1];
    var _b = react_1.useState(''), inpSysPassword = _b[0], setInpSysPassword = _b[1];
    var _c = react_1.useState('light'), themeSwitch = _c[0], setThemeSwitch = _c[1];
    var _d = react_1.useState(0), attempRemains = _d[0], setAttempRemains = _d[1];
    var reset = function () {
        setInpSysUsername('');
        setInpSysPassword('');
        sessionStorage.clear();
        localStorage.clear();
        initialRef.current = false;
    };
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
    var handlerVerifyAccess = function (e) { return __awaiter(void 0, void 0, Promise, function () {
        var button, err_1;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    // disable multiple click button login
                    e.preventDefault();
                    button = e.currentTarget;
                    button.disabled = true; // disable the button to prevent multiple clicks
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    if (attempRemains <= 0) {
                        reset();
                        setAttempRemains(0);
                        throw Error('Session locked');
                    }
                    if (inpSysUsername.length < 3 || inpSysPassword.length < 3) {
                        reset();
                        throw Error('Username or Password invalid');
                    }
                    // authenticate login
                    return [4 /*yield*/, axios_1["default"].get(server + "/user/login", {
                            headers: {
                                username: inpSysUsername,
                                password: inpSysPassword,
                                access: 'adsysop'
                            },
                            withCredentials: true
                        })
                            .then(function (res) {
                            if (res.data.valid) {
                                // then setting config
                                sessionStorage.setItem('username', inpSysUsername);
                                // all passes wait 1 sec to re-link to dashboard page
                                setTimeout(function () {
                                    navigate("/adsysop/" + inpSysUsername);
                                }, 1000);
                            }
                            else {
                            }
                        })["catch"](function (err) {
                            reset();
                            console.error(err);
                            sweetalert2_react_content_1["default"](sweetalert2_1["default"]).fire({
                                title: err.response.data.error
                            });
                            setAttempRemains(err.response.data.remains);
                            button.disabled = false;
                        })];
                case 2:
                    // authenticate login
                    _d.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _d.sent();
                    sweetalert2_react_content_1["default"](sweetalert2_1["default"]).fire({
                        title: (_c = (_b = (_a = err_1.message) !== null && _a !== void 0 ? _a : err_1.name) !== null && _b !== void 0 ? _b : err_1.response.data.error) !== null && _c !== void 0 ? _c : err_1
                    });
                    button.disabled = false;
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var loadRemain = function () { return __awaiter(void 0, void 0, Promise, function () {
        var response, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1["default"].get(server + "/general/getRemainsAttempts", {
                            headers: {
                                username: inpSysUsername,
                                access: 'adsysop'
                            },
                            withCredentials: true
                        })];
                case 1:
                    response = _a.sent();
                    setAttempRemains(response.data.remains);
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    setAttempRemains(err_2.response.data.remains);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    react_1.useEffect(function () {
        loadRemain();
        getSession();
        return function () {
            console.log('Reamining loaded');
            console.log('Session had set');
        };
    }, []);
    react_1.useEffect(function () {
        document.body.style.transition = 'background-color ease .3s';
        if (themeSwitch === '') {
            document.body.style.background = '#333';
        }
        else if (themeSwitch === 'light') {
            document.body.style.background = '#ddd';
        }
    }, [themeSwitch]);
    return (react_1["default"].createElement("div", { className: 'container' },
        react_1["default"].createElement("div", { className: 'row justify-content-center align-items-center h-svh-100' },
            react_1["default"].createElement("div", { className: 'col-12 col-md-6 col-lg-5' },
                react_1["default"].createElement(Switch_1["default"], { name: 'themeDarkLight', id: 'themeDarkLight', className: 'themeDarkLight', offValue: 'light', onValue: 'dark', setThemeSwitch: setThemeSwitch }),
                react_1["default"].createElement("div", { id: 'formAccess', className: themeSwitch },
                    react_1["default"].createElement(Form_1["default"], { action: '#', method: 'POST', className: 'loginFormAso p-15 p-md-20', id: 'loginFormAso', head: 'ASO', headClass: 'titleHead', subHead: 'Administrator system operation', subHeadClass: 'subHead', target: '_self', autoComplete: 'off' },
                        react_1["default"].createElement(Input_1["default"], { type: 'text', name: 'sysUsername', id: 'sysUsername', className: 'sysInput', onChange: function (e) { return getInputValue_1.getInputValue(e, setInpSysUsername); }, placeHolder: 'Username', value: inpSysUsername }),
                        react_1["default"].createElement("div", { className: 'inpPassAso' },
                            react_1["default"].createElement(Input_1["default"], { type: 'password', name: 'sysPassword', id: 'sysPassword', className: 'sysInput', onChange: function (e) { return getInputValue_1.getInputValue(e, setInpSysPassword); }, placeHolder: 'Password', value: inpSysPassword })),
                        react_1["default"].createElement("div", { className: 'd-flex justify-content-between align-items-center' },
                            react_1["default"].createElement(Button_1["default"], { type: 'button', name: 'submitAso', id: 'submitAso', className: 'submitAso', innerText: 'Login', disabled: inpSysUsername.length < 3 || inpSysPassword.length < 3, onClick: handlerVerifyAccess }),
                            react_1["default"].createElement("div", { id: 'attempRemains' },
                                react_1["default"].createElement("span", { "data-remain": attempRemains }, attempRemains),
                                react_1["default"].createElement("span", null, "/3")))))))));
};
exports["default"] = LoginPageDashboard;
