const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/react-native-widget-center/android/build.gradle');

if (fs.existsSync(filePath)) {
    console.log('Fixing react-native-widget-center build.gradle...');
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. Fix 'compile' configuration deprecation
    // Replace: classpath += files(project.getConfigurations().getByName('compile').asList())
    // With: // classpath += ...
    content = content.replace(
        "classpath += files(project.getConfigurations().getByName('compile').asList())",
        "// classpath += files(project.getConfigurations().getByName('compile').asList())"
    );

    // Fix 'implementation' configuration resolution error in Gradle 8+
    content = content.replace(
        "classpath += files(project.getConfigurations().getByName('implementation').asList())",
        "// classpath += files(project.getConfigurations().getByName('implementation').asList())"
    );

    // 3. Fix 'Cannot add task 'jar' as a task with that name already exists.'
    // Replace: task "jar"(type: Jar, dependsOn: javaCompileTask)
    // With: task "jar${name}"(type: Jar, dependsOn: javaCompileTask)
    content = content.replace(
        'task "jar"(type: Jar, dependsOn: javaCompileTask)',
        'task "jar${name}"(type: Jar, dependsOn: javaCompileTask)'
    );

    // 2. Fix 'classifier' property deprecation in Gradle 8

    // 2. Fix 'classifier' property deprecation in Gradle 8
    // Replace: classifier = 'javadoc'  -> archiveClassifier = 'javadoc'
    // Replace: classifier = 'sources'  -> archiveClassifier = 'sources'
    content = content.replace(/classifier = 'javadoc'/g, "archiveClassifier = 'javadoc'");
    content = content.replace(/classifier = 'sources'/g, "archiveClassifier = 'sources'");

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Successfully patched react-native-widget-center/android/build.gradle');
    } else {
        console.log('File already patched or target strings not found.');
    }
} else {
    console.log('react-native-widget-center/android/build.gradle not found, skipping patch.');
}
