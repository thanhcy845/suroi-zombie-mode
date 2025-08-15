// @ts-check
import postcssPresetEnv from "postcss-preset-env";
import postcssImport from "postcss-import";

export default {
    plugins: [
        postcssImport,
        // i don't know why eslint is freaking out over this

        postcssPresetEnv({
            features: {
                "nesting-rules": {
                    noIsPseudoSelector: false
                }
            }
        })
    ]
};
