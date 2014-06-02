define(['angular'], function (angular) {
    'use strict';

    var directives = angular.module('App.directives', [])
                        .directive('appVersion', ['version', function (version) {
                            return function (scope, elm, attrs) {
                                elm.text(version);
                            };
                        } ])

                        .directive('gameDiv', ['$log','PubNub',function($log,PubNub){
                            return {
                                restrict: 'E',
                                templateUrl: 'partials/gamediv.html',
                                link: function(scope, elm, attrs) {
                                    scope.uid = 'p'+Math.random();
                                    PubNub.init({
                                        publish_key: 'pub-cdc72730-41c8-4929-ab40-355c0b2cab4b',
                                        subscribe_key: 'sub-faf7eb11-0d87-11e2-8899-95dd86ce2293',
                                        uuid: scope.uid
                                    });
                                    scope.play_boxes = {};
                                    scope.turn = true;
                                    for(var i=0;i<9;i++){
                                        scope.play_boxes[i] = {
                                            id: i,
                                            val: null,
                                            player: null,
                                            updated: null
                                        };
                                    }

                                    function selectBox(box){
                                        if(scope.play_boxes[box].val!==null){
                                            $log.info('Box unavailable');
                                            return false;
                                        }
                                        scope.play_boxes[box].val = (scope.turn) ? 'x' : 'o';
                                        scope.play_boxes[box].player = 'adi';
                                        scope.play_boxes[box].updated = parseInt(new Date()/1000,10);
                                        return scope.play_boxes[box];
                                    }

                                    PubNub.ngSubscribe({
                                        channel:'exesandohs',
                                        message:function(res){
                                            $.extend(scope.play_boxes[res[0].id],res[0]);
                                            scope.$apply();
                                        },
                                        presence:function(res){
                                            console.log('presence: ',res);
                                        }
                                    });

                                    scope.takeTurn = function(box_id){
                                        var box = selectBox(box_id);
                                        if(box){
                                            var won = checkIfWon(scope.play_boxes);
                                            if(won){
                                                alert(won+' won');
                                            }
                                            PubNub.ngPublish({
                                                channel: 'exesandohs',
                                                message: box
                                              });
                                            scope.turn = !scope.turn;
                                        }

                                    };

                                    function checkIfWon(boxes){
                                        var values = new Array(9);
                                        var win_combos = [
                                            [0,4,8],
                                            [0,3,6],
                                            [0,1,2],
                                            [2,5,8],
                                            [0,3,6],
                                            [6,7,8],
                                            [2,4,6],
                                            [1,4,7]
                                        ];
                                        for(var box_id in boxes){
                                            if(boxes[box_id].val!==null){
                                                values[box_id] = boxes[box_id].val;
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
                                        for(var val in counts){
                                            for(var i=0;i<win_combos.length;i++){
                                                var diff = [];
                                                $.each(win_combos[i], function(key,value) {
                                                    if (-1 === counts[val].indexOf(value)) {
                                                        diff.push(value);
                                                    }
                                                });
                                                if(diff.length===0){
                                                    $log.info('GAME OVER! '+val+' won!');
                                                    return val;
                                                }
                                            }
                                            return false;
                                        }
                                    }
                                }
                            };
                        }]);

    return directives;
});

