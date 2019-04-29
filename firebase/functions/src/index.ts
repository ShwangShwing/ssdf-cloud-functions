const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);


exports.sendNewsNotification =
    functions.database.ref('/{dbCollection}/newsArticles/{articleKey}')
    .onWrite((change: any, context: any) => {
    // Grab the current value of what was written to the Realtime Database.
    const articleBefore = change.before.val();

    const getNodePath = (snapshot: any): string => {
        const rootUrlLength = snapshot.ref.root.toString().length;
        const nodePath = snapshot.ref.toString().substring(rootUrlLength + 1);
        return nodePath;
    }


    const newsArticleId = getNodePath(change.after);
    const articleAfter = change.after.val();
    const dbCollection = context.params.dbCollection;
    if (!articleAfter) {
        console.log("Article is null. Aborting.");
        return Promise.resolve();
    }

    console.log(`Article that caused function call: ${articleAfter.text}`);
    if (articleBefore) {
        console.log(`Article before published: ${articleBefore.isPublished}`);
    } else {
        console.log("No article before.");
    }
    console.log(`Article after published: ${articleAfter.isPublished}`);
    
    
    if ((!articleBefore || !articleBefore.isPublished) && articleAfter.isPublished) {

        // Notification details.
        const payload = {
            data: {
                newsArticleId,
                articleText: articleAfter.text,
                dbCollection
            },
        };

        // Set the message as high priority and have it expire after 24 hours.
        const options = {
        };

        // Send a message to devices subscribed to the provided topic.
        const topic = `/topics/ssdf-news`;
        return admin.messaging().sendToTopic(topic, payload, options)
        .then((response: string) => {
            console.log('Successfully sent message:', response);
        });
    } else {
        console.log('Message was already published or not set to published');
        return Promise.resolve();
    }
});

