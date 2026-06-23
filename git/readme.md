# git


create a new repository on the command line

```sh
echo "# tutorial" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/yangjunjun/tutorial.git
git push -u origin main
```

push an existing repository from the command line

```sh
git remote add origin https://github.com/yangjunjun/tutorial.git
git branch -M main
git push -u origin main
```