define(['angular'], function (angular) {
    'use strict';

    var directives = angular.module('App.directives', [])
                        .directive('appVersion', ['version', function (version) {
                            return function (scope, elm, attrs) {
                                elm.text(version);
                            };
                        } ])

                        .directive('gameDiv', ['$log','PubNub','$rootScope','$routeParams','$timeout',function($log,PubNub,$rootScope,$routeParams,$timeout){
                            return {
                                restrict: 'E',
                                templateUrl: 'partials/gamediv.html',
                                link: function(scope, elm, attrs) {
                                    function genRoomID(){
                                        //return chance.word(10);
                                        return 'abcdef';
                                    }
                                    var uid = chance.word(10);
                                    scope.initialize_game = function(){
                                        scope.play_boxes = {};
                                        scope.room_id = $routeParams.room_id || genRoomID();
                                        scope.turn = ($routeParams.room_id) ? false : true;
                                        scope.theChannel = 'exesandohs_'+scope.room_id;
                                        scope.character = ($routeParams.room_id) ? 'o' : 'x';
                                        scope.play_boxes = initialize_play_boxes();
                                        scope.winner = null;
                                        scope.user = {
                                            uid: uid,
                                            character: scope.character,
                                            boxes: []
                                        };
                                        scope.players_obj = {};
                                        scope.players_obj[scope.user.uid] = scope.user;

                                        // initialize_pubnub();

                                        function initialize_play_boxes(){
                                            var boxes = [];
                                            for(var i=0;i<9;i++){
                                                boxes[i] = {
                                                    id: i,
                                                    character: null,
                                                    uid: null,
                                                    updated: null
                                                };
                                            }
                                            return boxes;
                                        }
                                    };

                                    scope.initialize_game();

                                    // function initialize_pubnub(){
                                    PubNub.init({
                                        publish_key: 'pub-cdc72730-41c8-4929-ab40-355c0b2cab4b',
                                        subscribe_key: 'sub-faf7eb11-0d87-11e2-8899-95dd86ce2293',
                                        uuid: scope.user.uid
                                    });

                                    PubNub.ngSubscribe({
                                        channel: scope.theChannel
                                    });

                                    PubNub.ngHereNow({channel:scope.theChannel});
                                    $rootScope.$on(PubNub.ngPrsEv(scope.theChannel), function(event, payload) {
                                      scope.users = PubNub.ngListPresence(scope.theChannel);
                                      console.log(scope.users);
                                    });

                                    startIdenting();

                                    function startIdenting(){
                                        identMessage();
                                    }

                                    function identMessage(){
                                        $timeout(function(){
                                            PubNub.ngPublish({
                                                channel: scope.theChannel,
                                                message: { type: 'ident',
                                                           payload: scope.players_obj
                                                       }
                                            });
                                            identMessage();
                                        },5000);
                                    }

                                    $rootScope.$on(PubNub.ngMsgEv(scope.theChannel), function(event, payload) {
                                        // payload contains message, channel, env...
                                        console.log('got a message event:', payload.message);
                                        var msg = payload.message;
                                        if(msg.type == 'turn'){
                                            var box = selectBox(msg.payload.box.id,msg.payload.user);
                                            if(msg.payload.user.uid!==scope.user.uid){
                                                scope.turn = !scope.turn;
                                            }
                                            scope.finishTurn();
                                        }else if(msg.type == 'ident'){
                                            identOpponent(msg.payload);
                                        }else if(msg.type == 'reset'){
                                            scope.initialize_game();
                                        }
                                        // $.extend(scope.play_boxes[msg.id],msg);
                                        $rootScope.$apply();
                                    });
                                    // }

                                    function identOpponent(players_obj){
                                        $.extend(scope.players_obj,players_obj);
                                        scope.opponent = (function(obj){
                                            for(var k in obj){
                                                if(k != scope.user.uid){
                                                    return obj[k];
                                                }
                                            }
                                        })(players_obj);
                                        // identSelf();
                                    }

                                    function selectBox(box_id,user){
                                        if(scope.play_boxes[box_id].character!==null){
                                            $log.info('Box unavailable');
                                            return false;
                                        }
                                        scope.play_boxes[box_id].character = user.character;
                                        scope.play_boxes[box_id].uid = user.uid;
                                        scope.play_boxes[box_id].updated = parseInt(new Date()/1000,10);
                                        return scope.play_boxes[box_id];
                                    }

                                    scope.takeTurn = function(box_id){
                                        if(scope.winner!==null){
                                            return false;
                                        }
                                        if(!scope.turn){
                                            $log.error('Not your turn');
                                            return false;
                                        }
                                        var box = selectBox(box_id,scope.user);
                                        if(box){
                                            PubNub.ngPublish({
                                                channel: scope.theChannel,
                                                message: {
                                                    type: 'turn',
                                                    payload: {
                                                        user: scope.user,
                                                        box: box
                                                    }
                                                }
                                            });
                                            scope.turn = !scope.turn;
                                            scope.finishTurn();
                                        }
                                    };

                                    scope.finishTurn = function(box){
                                        var won = checkIfWon(scope.play_boxes);
                                        if(won){
                                            scope.winner = won;
                                        }
                                    };

                                    scope.reset_game = function(){
                                        PubNub.ngPublish({
                                            channel: scope.theChannel,
                                            message: {
                                                type: 'reset',
                                                payload: {
                                                    user: scope.user
                                                }
                                            }
                                        });
                                    };

                                    function checkIfWon(boxes){
                                        var values = new Array(9);
                                        var win_combos = [
                                            [0,1,2],
                                            [0,3,6],
                                            [0,4,8],
                                            [1,4,7],
                                            [2,4,6],
                                            [2,5,8],
                                            [3,4,5],
                                            [6,7,8]
                                        ];
                                        for(var box_id in boxes){
                                            if(boxes[box_id].character!==null){
                                                values[box_id] = boxes[box_id].character;
                                            }
                                        }
                                        var counts = {
                                            x: [],
                                            o: []
                                        };
                                        for(var i=0;i<values.length;i++){
                                            if(values[i]){
                                                counts[values[i]].push(i);
                                            }
                                        }
                                        for(var character in counts){
                                            for(var i=0;i<win_combos.length;i++){
                                                var diff = [];
                                                console.log(counts[character],win_combos[i]);
                                                $.each(win_combos[i], function(key,value) {
                                                    if (-1 === counts[character].indexOf(value)) {
                                                        diff.push(value);
                                                    }
                                                });
                                                console.log(diff);
                                                if(diff.length===0){
                                                    $log.info('GAME OVER! '+character+' won!');
                                                    $log.info('Winning combo: ',win_combos[i]);
                                                    for(var j=0;j<win_combos[j].length;j++){
                                                        scope.play_boxes[win_combos[i][j]].won = true;
                                                    }
                                                    return character;
                                                }
                                            }
                                        }
                                        return false;
                                    }
                                }
                            };
                        }]);

    return directives;
});

