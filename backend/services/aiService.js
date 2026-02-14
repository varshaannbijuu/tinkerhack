const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const generatePersonalizedContent = async (text, learningStyle) => {
    const styleInstruction = getStyleInstruction(learningStyle);

    const prompt = `
        You are an expert learning coach. Analyze the following text and generate a personalized study guide for a user with a "${learningStyle}" learning style.
        
        ${styleInstruction}

        The output MUST be a single, valid JSON object with the following structure:
        {
          "summary": "A concise summary of the text.",
          "reader_mode": "A detailed, article-style version of the content, well-structured with headings and paragraphs.",
          "visual_mode": {
              "steps": ["A list of visual steps or key points that could be turned into a diagram."],
              "structured_flow": "A description of a flowchart or diagram representing the information."
          },
          "audio_mode": {
              "narration": "A script for a short podcast or narration explaining the content conversationally."
          },
          "active_mode": {
              "puzzles": ["A list of one or two simple puzzles or thought experiments based on the text."],
              "mini_challenges": ["A list of one or two small, practical challenges the user can do."]
          },
          "quiz": [
              {
                  "question": "A multiple-choice question based on the content.",
                  "options": ["Option A", "Option B", "Option C", "Option D"],
                  "answer": "The correct option."
              }
          ]
        }

        Here is the text to analyze:
        ---
        ${text.substring(0, 8000)}
        ---
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview", // Or another suitable model
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        return JSON.parse(content);

    } catch (error) {
        console.error('Error calling OpenAI:', error);
        throw new Error('Failed to generate content from AI service.');
    }
};

const getStyleInstruction = (learningStyle) => {
    switch (learningStyle) {
        case 'Visual':
            return "Focus heavily on the 'visual_mode'. Generate creative and clear ideas for diagrams, flowcharts, and visual metaphors. The other modes can be less detailed.";
        case 'Audio':
            return "Focus heavily on the 'audio_mode'. Write a compelling and easy-to-follow narration script. The other modes can be less detailed.";
        case 'Reader':
            return "Focus heavily on the 'reader_mode'. Create a comprehensive and well-structured article. The other modes can be less detailed.";
        case 'Active':
            return "Focus heavily on the 'active_mode'. Design engaging puzzles and practical challenges that encourage hands-on learning. The other modes can be less detailed.";
        default:
            return "Provide a balanced output across all modes.";
    }
}

module.exports = {
    generatePersonalizedContent,
};
