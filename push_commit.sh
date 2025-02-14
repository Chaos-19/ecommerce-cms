# Author information
declare -A authors
authors["person1"]="Kalkidan Getachew <kalgetachew375@gmail.com>"
authors["person2"]="Firaol Tufa <olfira45@gmail.com>"
authors["person3"]="Bereket Abdela <bekibekina@gmail.com>"

# Remote and branch information
declare -A remotes
remotes["person1"]="https://Chaos-19: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@github.com/Chaos-19/Ecommerce_Admin_CMS.git"
#remotes["person2"]="https://username2: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@github.com/bekibekina/e-commerce.git"
#remotes["person3"]="https://Olfira45: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@github.com/Olfira45/e-commerce.git"



branch_name="main"  # Replace with your branch name

# Loop through each person and perform actions
for person in "${!authors[@]}"; do
    echo "Processing for $person..."

    # Change the author
    git commit --amend --author="${authors[$person]}" --no-edit

    # Push to their corresponding remote
    git push "${remotes[$person]}" "$branch_name" --force

    echo "Pushed for $person to remote ${remotes[$person]}"
done

echo "All remotes updated with respective authors."
