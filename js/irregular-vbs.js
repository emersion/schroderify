/**
 * Randomize array element order in-place.
 * Using Fisher-Yates shuffle algorithm.
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

$(function() {
	var verbs, declinations, score, config = {
		questions: 0,
		chronometer: false
	};

	var $startCtn = $('#start'),
		$startBtn = $startCtn.find('.start a'),
		$customizeBtn = $startCtn.find('.customize a'),
		$loadingCtn = $('#loading'),
		$questionCtn = $('#question'),
		$endCtn = $('#end'),
		$scoreCtn = $('#score'),
		$chronoCtn = $('#chronometer'),
		$answerActionsCtn = $questionCtn.find('.answer-actions'),
		$nextBtn = $answerActionsCtn.find('.next a'),
		$stopBtn = $answerActionsCtn.find('.stop a'),
		$restartBtn = $endCtn.find('.restart a'),
		$customizeCtn = $('#customize-modal'),
		$customizeSaveBtn = $customizeCtn.find('.customize-save');

	var formatTime = function (duration) {
		var time = new Date(duration);

		var durMinutes = time.getMinutes(),
			durSeconds = time.getSeconds(),
			durMs = time.getMilliseconds();

		var humanDur = '';
		if (durMinutes) {
			humanDur += ' '+durMinutes+'min';
		}
		if (durSeconds) {
			humanDur += ' '+durSeconds+'s';
		}
		if (durMs) {
			humanDur += ' '+durMs+'ms';
		}

		return humanDur;
	};

	var firstStart = true;
	var showStart = function () {
		score = {
			answers: { good: 0, bad: 0, total: 0 },
			answersTime: [],
			startTime: 0,
			endTime: 0,
			result: 0
		};

		if (firstStart) {
			$startCtn.show();
			$loadingCtn.hide();
			$questionCtn.hide();
			$endCtn.hide();
			$scoreCtn.hide();
			$chronoCtn.hide();
		} else {
			$startCtn.slideDown();
			$endCtn.slideUp();
			$scoreCtn.slideUp();
		}

		firstStart = false;
	};

	var setConfig = function () {
		var $questionsNbr = $startCtn.find('.cfg-questions-nbr'),
			$chrono = $startCtn.find('.cfg-chrono');

		config.questions = Math.abs(parseInt($questionsNbr.val())) || 0;
		config.chronometer = $chrono.find('.chrono-on').is('.active');
	};

	var chronoIntervalId = null;
	var startChronometer = function () {
		if (!score.startTime) {
			score.startTime = (new Date()).getTime();
		}

		if (chronoIntervalId !== null) { //Already started
			return;
		}

		if (score.endTime > 0) {
			score.startTime += (new Date()).getTime() - score.endTime;
		}

		if (config.chronometer) {
			var $chrono = $chronoCtn.find('.chronometer-inner');

			var updateChrono = function () {
				var duration = (new Date()).getTime() - score.startTime;
				var durationSeconds = Math.round(duration / 1000);

				if (!durationSeconds) {
					return;
				}

				$chrono.html(formatTime(durationSeconds * 1000));
			};

			chronoIntervalId = setInterval(function () {
				updateChrono();
			}, 1000);
			updateChrono();
		}
	};
	var stopChronometer = function () {
		score.endTime = (new Date()).getTime();

		if (!chronoIntervalId) { //Not started
			return;
		}

		if (config.chronometer) {
			clearInterval(chronoIntervalId);
			chronoIntervalId = null;
		}
	};

	var startQuestions = function () {
		$startCtn.slideUp();
		setConfig();

		$loadingCtn.slideDown();

		Schroderify.pullDb('verbs').done(function(data) {
			verbs = data.verbs;
			declinations = data.declinations;

			$questionCtn.slideDown();

			if (config.chronometer) {
				$chronoCtn.slideDown();
			}

			nextQuestion();
		}).fail(function(msg) {
			alert('Sausage Potatoe Digital error ('+msg+')');
		}).always(function () {
			$loadingCtn.slideUp();
		});
	};

	var showSuccessAnimation = function (centerPos) {
		var $successCircle = $('<div></div>').addClass('question-success');

		for (var i = 0; i < 0; i++) {
			(function () {
				var $circle = $successCircle.clone();

				var before = {
					dim: $(window).width() / 10,
					pos: {}
				}, after = {
					dim: $(window).width(),
					pos: {}
				};

				after.pos.x = centerPos.x - after.dim / 2;
				after.pos.y = centerPos.y - after.dim / 2;
				before.pos.x = after.pos.x + after.dim / 2 - before.dim / 2;
				before.pos.y = after.pos.y + after.dim / 2 - before.dim / 2;

				$circle.css({
					'z-index': '-1',
					'position': 'absolute',
					'width': before.dim+'px',
					'height': before.dim+'px',
					'left': before.pos.x+'px',
					'top': before.pos.y+'px',
					'border-radius': '100%',
					'background-color': 'rgb(71, 164, 71)'
				}).prependTo('body').animate({
					'opacity': 0,
					'width': after.dim+'px',
					'height': after.dim+'px',
					'left': after.pos.x+'px',
					'top': after.pos.y+'px'
				}, 'normal', function() {
					$(this).remove();
				});
			})();
		}
	};

	var remainingVerbs = null;
	var nextQuestion = function () {
		if (remainingVerbs === null) {
			remainingVerbs = $.extend({}, verbs);
		}

		if (Object.keys(remainingVerbs).length == 0 || (config.questions && config.questions <= score.answers.total)) {
			showEnd();
			return;
		}

		var randomIndex = Math.round(Math.random() * (Object.keys(remainingVerbs).length - 1)),
			randomVerb = Object.keys(remainingVerbs)[randomIndex],
			randomVerbData = verbs[randomVerb],
			randomVerbMeaning = randomVerbData.meaning.fr_FR,
			randomVerbDisabled = randomVerbData.disabled;

		delete remainingVerbs[randomVerb];

		if (randomVerbDisabled) { //Skip this one
			nextQuestion();
			return;
		}

		var $questionVerb = $questionCtn.find('h2 .question-inner'),
			$answerComment = $questionCtn.find('h2 .answer-comment'),
			$declCtn = $questionCtn.find('.answers-container');

		startChronometer();

		var answerStartTime = (new Date()).getTime();
		var updateScore = function () {
			score.answersTime.push((new Date()).getTime() - answerStartTime);

			var $goodProgress = $scoreCtn.find('.progress-bar-success'),
				$badProgress = $scoreCtn.find('.progress-bar-danger');

			var goodPercentage = score.answers.good / score.answers.total * 100,
				badPercentage = score.answers.bad / score.answers.total * 100;

			$goodProgress.width(goodPercentage + '%');
			$badProgress.width(badPercentage + '%');

			$goodProgress.find('.sr-only').html(Math.round(goodPercentage) + '% ('+score.answers.good+' r&eacute;ussites)');
			$badProgress.find('.sr-only').html(Math.round(badPercentage) + '% ('+score.answers.bad+' &eacute;checs)');

			if ($scoreCtn.is(':hidden')) {
				$scoreCtn.slideDown();
			}
		};

		var showAnswerComment = function (isGood) {
			$answerComment.removeClass('text-success text-danger');

			var comments = {
				good: ['Good!','Well done!','Right!','Yeah!'],
				bad: ['Bad!','Das ist schlecht!','Wrong!','Ouch...']
			};

			if (isGood) {
				$answerComment.addClass('text-success');
			} else {
				$answerComment.addClass('text-danger');
			}

			var thisAnswerComments = comments[(isGood) ? 'good' : 'bad'];
			var comment = thisAnswerComments[Math.round(Math.random() * (thisAnswerComments.length - 1))];
			$answerComment.html(comment);

			$answerComment.css({
				opacity: 1
			}).animate({
				opacity: 0
			}, 'slow');
		};

		var showAnswer = function () {
			stopChronometer();

			$answerActionsCtn.show();

			$declCtn.children().off('click').addClass('btn-default').removeClass('btn-primary');
			$declCtn.children('.answer').addClass('btn-success');
			$declCtn.children('.clicked:not(.answer)').addClass('btn-danger');

			var isGood = ($declCtn.children('.clicked.answer').length > 0);
			if (isGood) {
				score.answers.good++;
				showSuccessAnimation({ x: 100, y: 140 });
			} else {
				score.answers.bad++;
			}
			score.answers.total++;
			updateScore();
			showAnswerComment(isGood);
		};

		var paradoxalStar = (randomVerbData.type == 'paradoxal') ? '<span class="tooltip-container" data-toggle="tooltip" data-placement="bottom" title="This is a paradoxal verb. Irregular because its root changes, regular because it takes regular declinations.">*</span>' : '';
		$questionVerb.html(randomVerb+(paradoxalStar || '')+' <small>('+randomVerbMeaning+')</small>').find('.tooltip-container').tooltip();
		$answerActionsCtn.hide();

		var answers = [];
		if (!randomVerbData.declination) {
			var slashIndex = randomVerb.indexOf('/');
			if (typeof slashIndex == 'number' && slashIndex >= 0) {
				var baseVerb = randomVerb.slice(slashIndex + 1);
				randomVerbData.declination = verbs[baseVerb].declination;

				//TODO: add separated part in declinations if it is an array
			}
		}
		if (randomVerbData.declination instanceof Array) {
			var verbDeclList = randomVerbData.declination;
			answers.push({
				value: verbDeclList.join(', '),
				correct: true
			});

			//TODO: random answers
		} else {
			var verbDecl = declinations[randomVerbData.declination];

			for (var declName in declinations) {
				var declPattern = declinations[declName];
				if (declPattern[0] == verbDecl[0]) {
					answers.push({
						value: declPattern.join(', '),
						correct: (randomVerbData.declination == declName)
					});
				}
			}

			//TODO: random answers if there is only one
		}

		$declCtn.empty();
		answers = shuffleArray(answers);
		for (var i = 0; i < answers.length; i++) {
			(function(ans) {
				var $ans = $('<label></label>').addClass('btn btn-primary');
				$ans.append('<input type="radio"> '+ans.value);

				$ans.click(function() {
					$ans.addClass('clicked');
					showAnswer();
				});

				if (ans.correct) {
					$ans.addClass('answer');
				}

				$declCtn.append($ans);
			})(answers[i]);
		}
	};

	var showEnd = function () {
		var duration = score.endTime - score.startTime;
		$endCtn.find('.score-time').find('.score-time-inner').html(formatTime(duration));

		var timeSum = score.answersTime.reduce(function(a, b) { return a + b; });
		score.answersTimeAvg = timeSum / score.answersTime.length;

		score.result = (1/Math.sqrt(duration)*Math.sqrt(score.answers.good) + score.answers.good*10)*1000;

		$endCtn.find('.score-result').html(Math.round(score.result));

		$questionCtn.slideUp();
		$chronoCtn.slideUp();
		$endCtn.slideDown();

		$scoreCtn.find('.progress-bar .sr-only').removeClass('sr-only');
	};

	var verbsHandlers = {};
	var showCustomizeVerbs = function () {
		var $loadingCtn = $customizeCtn.find('.loading-ctn'),
			$customizeTable = $customizeCtn.find('table'),
			$customizeTbody = $customizeTable.find('tbody');

		var addToVerbsList = function (data) {
			if (!data) {
				return;
			}

			var $declList = $('<select></select>').addClass('input-group');
			for (var declName in data.declinations) {
				$declList.append('<option value="'+declName+'">'+data.declinations[declName].join(', ')+'</option>');
			}

			for (var verbName in data.verbs) {
				(function(verbName, verbData) {
					if (typeof verbData.declination != 'string') { //Not supported
						return;
					}

					var $row = $('<tr></tr>');

					var fillRow = function (verbData) {
						var $enableCheckbox = $('<input />', { type: 'checkbox' });
						if (!verbData.disabled) {
							$enableCheckbox.attr('checked', 'checked');
						}
						$('<td></td>').append($enableCheckbox).appendTo($row);

						$row.append('<td>'+verbName+'</td>');

						var $verbDeclList = $declList.clone();
						$verbDeclList.val(verbData.declination);
						$('<td></td>').append($verbDeclList).appendTo($row);

						var $inputGroup = $('<div></div>').addClass('input-group');
						var $meaning = $('<input />', { type: 'text', value: (verbData.meaning) ? verbData.meaning.fr_FR : '' }).addClass('form-control').appendTo($inputGroup);

						if ($.inArray('local', verbData.places) !== -1) {
							var $btns = $('<span></span>')
								.addClass('input-group-btn')
								.appendTo($inputGroup);

							if ($.inArray('remote', verbData.places) === -1) {
								var $deleteBtn = $('<button></button>', { type: 'button' })
									.addClass('btn btn-danger')
									.html('<span class="glyphicon glyphicon-trash"></span>')
									.click(function() {
										$row.remove();
										verbsHandlers[verbName] = function () { return false; };
									})
									.appendTo($btns);
							} else {
								var $deleteBtn = $('<button></button>', { type: 'button' })
									.addClass('btn btn-warning')
									.html('<span class="glyphicon glyphicon-backward"></span>')
									.click(function() {
										$row.empty();
										var remoteVerbData = remoteData.verbs[verbName];
										remoteVerbData.places = ['remote'];
										fillRow(remoteVerbData);
									})
									.appendTo($btns);
							}
						} else {
							$inputGroup.removeClass('input-group');
						}
						$('<td></td>').append($inputGroup).appendTo($row);

						verbsHandlers[verbName] = function () {
							var verbNewData = {};

							if (!$enableCheckbox.is(':checked')) {
								verbNewData.disabled = true;
							}

							if ($verbDeclList.val() != verbData.declination) {
								verbNewData.declination = $verbDeclList.val();
							}

							if ($meaning.val() != verbData.meaning.fr_FR) {
								verbNewData.meaning = { fr_FR: $meaning.val() };
							}

							return verbNewData;
						};
					};

					fillRow(verbData);

					$row.appendTo($customizeTbody);
				})(verbName, data.verbs[verbName]);
			}
		};

		var showAddVerbBtn = function () {
			var $row = $('<tr></tr>');

			$('<td></td>').appendTo($row);

			var $inputGroup = $('<div></div>').addClass('input-group');
			var $verbName = $('<input />', { type: 'text' }).addClass('form-control').appendTo($inputGroup);

			var $btns = $('<span></span>')
				.addClass('input-group-btn')
				.appendTo($inputGroup);

			var $addBtn = $('<button></button>', { type: 'button' })
				.addClass('btn btn-success')
				.html('<span class="glyphicon glyphicon-plus"></span>')
				.click(function() {
					var addData = { verbs:{}, declinations: remoteData.declinations };
					addData.verbs[$verbName.val()] = {
						declination: '',
						meaning: {
							fr_FR: ''
						},
						places: ['local']
					};
					addToVerbsList(addData);

					$row.detach().appendTo($customizeTbody);
				})
				.appendTo($btns);

			$('<td></td>', { colspan: '3' }).append($inputGroup).appendTo($row);

			$row.appendTo($customizeTbody);
		};

		$customizeTable.hide();
		$customizeTbody.empty();
		verbsHandlers = {};

		var localData = Schroderify.pullLocalDb('verbs'), remoteData;

		Schroderify.pullRemoteDb('verbs').done(function (receivedData) {
			$customizeTable.show();
			customizeDbLoaded = true;

			remoteData = receivedData;
			var data = $.extend(true, {}, remoteData);

			if (localData) {
				for (var verbName in localData.verbs) {
					if (data.verbs[verbName]) {
						data.verbs[verbName] = $.extend(true, {}, data.verbs[verbName], localData.verbs[verbName], { places: ['local','remote'] });
					} else {
						data.verbs[verbName] = localData.verbs[verbName];
						data.verbs[verbName].places = ['local'];
					}
				}
			}

			addToVerbsList(data);
		}).fail(function (msg) {
			alert('Sausage Potatoe Digital error ('+msg+')');

			addToVerbsList(localData);
		}).always(function () {
			$loadingCtn.slideUp();

			showAddVerbBtn();
		});
	};
	var saveCustomizeVerbs = function () {
		var localData = {};
		for (var verbName in verbsHandlers) {
			var verbData = verbsHandlers[verbName]();

			if (verbData && Object.keys(verbData).length > 0) {
				localData[verbName] = verbData;
			}
		}

		Schroderify.pushLocalDb('verbs', { verbs: localData });

		$customizeCtn.modal('hide');
	};

	$startBtn.click(function (e) {
		startQuestions();
		e.preventDefault();
	});

	$customizeBtn.click(function (e) {
		showCustomizeVerbs();
		e.preventDefault();
	});
	if (!Schroderify.supportsLocalDb()) {
		$customizeBtn.hide();
	}
	$customizeSaveBtn.click(function () {
		saveCustomizeVerbs();
	});

	$nextBtn.click(function (e) {
		nextQuestion();
		e.preventDefault();
	});
	$stopBtn.click(function (e) {
		showEnd();
		e.preventDefault();
	});

	$restartBtn.click(function (e) {
		showStart();
		e.preventDefault();
	});

	showStart();
});