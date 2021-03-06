import fs from 'fs/promises';
import mkdirtemp from 'mkdirtemp';
import test from 'ava';
import caretDeps from './lib/rule/caret-deps';
import git from './lib/git';

const makePackage = (pkg) => {
    return { pkg };
};

test('rule: caret-deps', (t) => {
    t.falsy(caretDeps({}), 'must ignore non-packages');
    t.falsy(caretDeps(makePackage({})), 'must ignore empty packages');
    t.falsy(caretDeps(makePackage({ dependencies : {} })), 'must ignore packages with no dependencies');

    const nonSemver = makePackage({
        dependencies : {
            'build-path' : 'git@github.com:sholladay/build-path.git',
            'build-data' : 'sholladay/build-data',
            'build-keys' : 'latest',
            'build-dir'  : './directory',
            scube        : 'file:../foo/bar',
            delivr       : 'https://example.com/ball.tar.gz'
        }
    });
    t.falsy(caretDeps(nonSemver), 'must ignore non-semver dependencies');

    const caret = makePackage({
        dependencies : {
            'build-path' : '^1.0.0'
        }
    });
    t.falsy(caretDeps(caret), 'must pass for caret dependencies');

    const pinned = makePackage({
        dependencies : {
            'build-path' : '1.0.0'
        }
    });
    t.deepEqual(caretDeps(pinned), {
        path    : 'package.json',
        message : 'Package has pinned dependencies',
        data    : {
            dependencies : {
                'build-path' : {
                    expected : '^1.0.0',
                    wanted   : '1.0.0'
                }
            }
        }
    });
});

test('git helper module', async (t) => {
    const cwd = await mkdirtemp();
    const emptyDir = await fs.readdir(cwd);
    t.is(emptyDir.length, 0);
    await git('init', { cwd });
    const dirWithGit = await fs.readdir(cwd);
    t.is(dirWithGit.length, 1);
    t.is(dirWithGit[0], '.git');

    await fs.writeFile(`${cwd}/test.js`, 'rng');
    const checkRepo = await git('status --porcelain', { cwd });
    t.is(checkRepo.slice(2), ' test.js');
});
