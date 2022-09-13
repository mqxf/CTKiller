import { v4 as uuid4 } from "uuid";
import { UserService } from "../user.service";

import { reveal, transaction, TransactionResponse, loadNugget, initialise, Nugget, pingQuestion, submitAnswer, QuestionGroup, closeNugget, pingContent, getSlide, doSlide, focus, blur, results } from "./network";
import { sleep } from "./utils";

export class NuggetSolver {

    private solving: boolean = false;
    private questionGroupId: string = "";
    private questionId: string = "";
    private question: number = 0;
    private group: QuestionGroup;
    private questions: boolean = false;
    private fragmentId: string = "";
    private documentId: string = "";
    private lastDocumentId: string = "";
    private contentId: string = "";

    constructor(private user: UserService) { }

    get token() {
        return this.user.token;
    }

    get userId() {
        return this.user.userId;
    }

    get loginSessionId() {
        return this.user.loginSessionId;
    }

    private async solveQuestion(questionId: string) {
        var transRes: TransactionResponse | null = null;
        for (let i = 0; i < 10; i++) {
            try {
                transRes = await transaction(questionId, uuid4(), this.token);
                break;
            } catch (err: any) {
                if (err.status == 403) throw err;
                if (i == 9) throw err;
            }
        }
        let token = transRes!.accessTokens[0].token;
        let answer = await reveal(token);
        return answer;
    }

    async solveNextNugget(offset: number) {
        console.log("Looking for next recommended nugget...");
        let nextNuggetLoader = await loadNugget(this.userId, 1, offset, this.token);
        console.log("Found next recommended nugget!");
        let nextNugget = await initialise(
            nextNuggetLoader.data.nuggetPath.nuggets[0].courses[0].studyGroupIds[0].studyGroupId,
            nextNuggetLoader.data.nuggetPath.nuggets[0].nugget.nuggetId,
            this.token
        );
        await this.solveNugget(nextNugget);
    }

    async solveNugget(nugget: Nugget) {
        console.log(`Doing nugget ${nugget.nugget.name}`);
        this.solving = true;
        this.question = 0;
        if (nugget.activity.questions != null) {
            this.question = nugget.activity.questions.length;
            if (nugget.activity.questions[this.question - 1]?.answers?.length == 0) {
                this.question--;
            }
        }

        //let fragment = nugget.nugget.content.find(q => q.type == "fragment");

        let started: boolean = false;
        /*
        if (fragment != null) {
            console.log("Found fragment!");
            fragmentId = fragment.id;
            let slideshow = fragment.items.find(q => q.fragmentType!.name == "Slideshow");
            if (slideshow != null) {
                console.log("Found slideshow!");
                contentId = slideshow._id;
                if (nugget.data.selectedItem.type == "document") {
                    documentId = nugget.data.selectedItem.documentId!;
                    pingLoop(nugget);
                    started = true;
                    await completeDocument(nugget);
                }
                else {
                    pingLoop(nugget);
                    started = true;
                }
                for (let i = 0; i < slideshow.documents!.length; i++) {
                    documentId = slideshow.documents![i]._id;
                    await completeDocument(nugget);
                    console.log(`Completed slide ${i + 1}/${slideshow!.documents!.length}`);
                }
            }
        }
        */
        let assessment = nugget.nugget.content.find(q => q.type == "assessment")!;
        this.getQuestion(nugget, assessment);
        this.questions = true;
        if (!started) {
            this.pingLoop(nugget);
        }
        for (let i = this.question; i < assessment.items[0].questionGroups!.length; i++) {
            this.getQuestion(nugget, assessment);
            let answer = await this.solveQuestion(this.questionId);
            var answerStr: string = "";
            if (answer.answerType == "exact-answer") {
                answerStr = answer.answerGroups[0].answers![0].exactInput[0];
            }
            else if (answer.answerType == "multi-one-correct") {
                answerStr = answer.answerGroups[0].correctAnswerIds![0];
            }
            else if (answer.answerType == "exact-answer-equation") {
                answerStr = answer.answerGroups[0].answers![0].exactInput[0].replace("\\\\", "\\");
            }
            else {
                console.log(`UNKNOWN ANSWER TYPE: ${answer.answerType}! Halting! Please contact your administrator to fix this.`);
                process.exit();
            }
            //await sleep(1000);
            await submitAnswer(
                this.loginSessionId,
                answerStr,
                this.group.questions.find(q => q._id == this.questionId)!.answerGroups[0].id, nugget.assessments[0]._id,
                nugget.activity.studySession.courseId,
                nugget.activity.studySession.studySessionId,
                nugget.activity.studySession.strandId,
                this.questionId,
                this.questionGroupId,
                nugget.nugget._id,
                this.token
            );
            console.log(`Answered question ${this.question + 1}/${assessment.items[0].questionGroups!.length}`);
            this.question++;
        }
        this.solving = false;
        //await sleep(1000);
        await closeNugget(nugget.activity.studySession.studySessionId, this.token);
        let res = await results(nugget.activity.studySession.studySessionId, this.token);
        console.log(`Finished nugget ${nugget.nugget.name} with a score of ${res.activity.overallResult.percentScore / 100}%!`);
        this.lastDocumentId = "";
    }

    getQuestion(nugget: Nugget, assessment: any) {
        this.questionGroupId = assessment.items[0].questionGroups![this.question]._id;
        this.group = nugget.assessments[0].questionGroups.find(q => q._id == this.questionGroupId)!;

        let randomQuestion = Math.floor(Math.random() * this.group.questions.length);
        this.questionId = this.group.questions[randomQuestion]._id;
    }

    private async pingLoop(nugget: Nugget) {

        let questionBase: number = 70000;
        let questionRandom: number = 80000;
        let contentBase: number = 10000;
        let contentRandom: number = 30000;

        while (this.solving) {
            if (this.questions) {
                pingQuestion(
                    this.loginSessionId,
                    nugget.assessments[0]._id,
                    this.questionGroupId,
                    this.questionId,
                    nugget.nugget._id,
                    nugget.activity.studySession.strandId,
                    nugget.activity.studySession.courseId,
                    nugget.activity.studySession.studySessionId,
                    (Math.random() * contentRandom) + contentBase,
                    this.token
                );
            }
            else {
                pingContent(
                    this.loginSessionId,
                    nugget.nugget._id,
                    nugget.activity.studySession.strandId,
                    nugget.activity.studySession.courseId,
                    nugget.activity.studySession.studySessionId,
                    this.documentId,
                    this.fragmentId,
                    this.contentId,
                    (Math.random() * questionRandom) + questionBase,
                    this.token
                );
            }
            await sleep(200);
        }
    }

    private async completeDocument(nugget: Nugget) {
        if (this.lastDocumentId != "") {
            blur(
                this.loginSessionId,
                this.lastDocumentId,
                this.fragmentId,
                this.contentId,
                nugget.nugget._id,
                nugget.activity.studySession.strandId,
                nugget.course._id,
                nugget.activity.studySession.studySessionId,
                10000,
                this.token
            );
        }
        focus(
            this.loginSessionId,
            this.documentId,
            this.fragmentId,
            this.contentId,
            nugget.nugget._id,
            nugget.activity.studySession.strandId,
            nugget.course._id,
            nugget.activity.studySession.studySessionId,
            0,
            this.token
        );
        doSlide(
            nugget.studyGroup._id,
            nugget.nugget._id,
            nugget.nugget.name,
            this.userId,
            this.loginSessionId,
            nugget.activity.studySession.studySessionId,
            nugget.class._id,
            nugget.class.name,
            nugget.course._id,
            nugget.course.name,
            this.fragmentId,
            this.documentId,
            this.token
        );
        this.lastDocumentId = this.documentId;
        getSlide(this.documentId, this.token);
        await sleep(1000);
        blur(
            this.loginSessionId,
            this.lastDocumentId,
            this.fragmentId,
            this.contentId,
            nugget.nugget._id,
            nugget.activity.studySession.strandId,
            nugget.course._id,
            nugget.activity.studySession.studySessionId,
            10000,
            this.token
        );
        focus(
            this.loginSessionId,
            this.documentId,
            this.fragmentId,
            this.contentId,
            nugget.nugget._id,
            nugget.activity.studySession.strandId,
            nugget.course._id,
            nugget.activity.studySession.studySessionId,
            10000,
            this.token
        );
        await sleep(1000);
    }
}