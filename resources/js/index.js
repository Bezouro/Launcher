'use strict'

const $ = require('jquery')
const versions = require('../resources/js/versions.js')
const AssetsDownload = require('../resources/js/assetsDownload')
const { remote } = require('electron')
const config = require('../config.js')
const ygg = require('litecraft-yggdrasil')({})

let doingLogin = false

function dropdownList() {
    if (document.getElementById('languageDropdown')) {
        document.getElementById('languageDropdown').classList.toggle('show')
        if (document.getElementById('languageDropdown').classList.contains('show')) {
            document.getElementById('language-btn').classList.add('active')
        } else {
            document.getElementById('language-btn').classList.remove('active')
        }
    }
}

function dropdownProfile() {
    if (document.getElementById('profileDropdown')) {
        document.getElementById('profileDropdown').classList.toggle('show')
        if (document.getElementById('profileDropdown').classList.contains('show')) {
            document.getElementById('profile-btn').classList.add('active')
        } else {
            document.getElementById('profile-btn').classList.remove('active')
        }
    }
}

function dropdownVersions() {
    if (document.getElementById('versionsDropdown')) {
        document.getElementById('versionsDropdown').classList.toggle('show')
        if (document.getElementById('versionsDropdown').classList.contains('show')) {
            document.getElementById('versions-btn').classList.add('active')
        } else {
            document.getElementById('versions-btn').classList.remove('active')
        }
    }
}

$(document).on('click', (event) => {
    if (!event.target.matches('#language-btn')) {
        if (document.getElementById('languageDropdown')) {
            let openDropdown = document.getElementById('languageDropdown')
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show')
                document.getElementById('language-btn').classList.remove('active')
            }
        }
    }
    if (!event.target.matches('#profile-btn')) {
        if (document.getElementById('profileDropdown')) {
            let openDropdown = document.getElementById('profileDropdown')
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show')
                document.getElementById('profile-btn').classList.remove('active')
            }
        }
    }
    if (!event.target.matches('#versions-btn')) {
        if (document.getElementById('versionsDropdown')) {
            let openDropdown = document.getElementById('versionsDropdown')
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show')
                document.getElementById('versions-btn').classList.remove('active')
            }
        }
    }
})

$(document).ready(() => {
    // Register 'future' events
    let body = $('body')
    body.on('click', 'a#language-btn', dropdownList)
    body.on('click', 'a#profile-btn', dropdownProfile)
    body.on('click', 'a#versions-btn', dropdownVersions)
    body.on('click', 'a#play-btn', () => {
        // TODO: Get Minecraft version to download from Litecraft's web API
        new AssetsDownload(remote.app.getPath('userData')).getAllAssets('1.12.2')
    })
    body.on('submit', '#login-form', doLogin)
    body.on('click', '#minimize', () => {
        remote.getCurrentWindow().minimize()
    })
    body.on('click', '#close', () => {
        remote.getCurrentWindow().close()
    })

    body.on('webkitAnimationEnd oanimationend msAnimationEnd animationend', '#login-form', function () {
        $('#login-form').delay(200).removeClass('ahashakeheartache')
    })

    checkInternet((isConnected) => {
        if (config.get('accessToken')) {
            console.log('accessToken found!')
            if (isConnected) {
                ygg.validate(config.get('accessToken'), (valid) => {
                    if (!valid) {
                        config.set('accessToken', '')
                        config.set('clientToken', '')
                        config.set('availableProfiles', [{}])
                        config.set('selectedProfile', '')
                        requestContent('login.pug')
                        window.setTimeout(() => {
                            $('#user').val(config.get('username'))
                        }, 185)
                    } else {
                        requestContent('main.pug')
                    }
                    console.log(valid)
                })
            } else {
                console.log('You are offline!')
                requestContent('main.pug')
            }
        } else {
            console.log('No accessToken found, returning to login screen')
            requestContent('login.pug')
            if (config.get('username')) {
                window.setTimeout(() => {
                    $('#user').val(config.get('username'))
                }, 120)
            }
        }
    })

    function requestContent(file) {
        $('.content').removeClass('fadeIn')
        $('.content').addClass('fadeOut')
        history.pushState(null, null, file)
        $.ajax({
            url: file,
            success: (data) => {
                /*while ($('.content').filter(':animated').length > 0) {

                }*/
                $('.content').removeClass('fadeOut')
                $('.content').html($(data).find('.content').addBack('.content').children())
                $('.content').addClass('fadeIn')
            }
        })
    }

    function doLogin(event) {
        event.preventDefault()
        if (!doingLogin) {
            doingLogin = true
            console.log('Trying to login...')

            let user = $('#user')
            let password = $('#password')

            user.prop('disabled', true)
            password.prop('disabled', true)

            ygg.auth({
                user: user.val(),
                pass: password.val()
            }, (err, data) => {
                user.prop('disabled', false)
                password.prop('disabled', false)

                if (err) {
                    doingLogin = false
                    console.error(err)
                    $('#login-form').addClass('ahashakeheartache')
                    return
                }
                config.set('accessToken', data.accessToken)
                config.set('clientToken', data.clientToken)
                config.set('username', user.val())

                config.set('availableProfiles', data.availableProfiles)
                config.set('selectedProfile', data.selectedProfile)
                console.log('Logged in successfully!')
                requestContent('main.pug')
            })
        }
    }

    function checkInternet(cb) {
        require('dns').lookup('minecraft.net', (err) => {
            if (err && err.code === 'ENOTFOUND') {
                cb(false)
            } else {
                cb(true)
                versions.updateVersionCache()
                console.log(versions.getSelectedVersion())
            }
        })
    }
})

$(window).on('beforeunload', (e) => {
    e.returnValue = false
    remote.app.relaunch()
    remote.getCurrentWindow().close()
})
